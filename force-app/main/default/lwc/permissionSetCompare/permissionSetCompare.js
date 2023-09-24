import { LightningElement, track, api } from 'lwc';
import getAllFieldPermissionByPermissionSetId from "@salesforce/apex/PermissionSetCompareUtility.getAllFieldPermissionByPermissionSetId";
import getAllObjectPermissionByPermissionSetId from "@salesforce/apex/PermissionSetCompareUtility.getAllObjectPermissionByPermissionSetId";
import getAllObjectsOfOrg from "@salesforce/apex/PermissionSetCompareUtility.getAllObjectsOfOrg";
import getAllPermissionSets from "@salesforce/apex/PermissionSetCompareUtility.getAllPermissionSets";
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class PermissionSetCompare extends LightningElement {

    @track objectOptions;
    @track permissionOptions = [];
    @track selectedObjects = [];
    @api permIdOne;
    @api permIdTwo;
    @track fieldComparisonResult;

    @track permOneName;
    @track permTwoName;


    //Not used
    @track differenceData;
    @track objectApiString;
    @track permOne = [];
    @track permTwo = [];
    @track diff
    // Not Used End


    setTestData(one, two, obj) {
        this.permIdOne = one;
        this.permIdTwo = two;
        this.objectApiString = obj;
        this.selectedObjects = this.objectApiString.split(',');
    }

    async connectedCallback() {
        this.setTestData('0PS2x000001fV5LGAU', '0PS2x000001bM3aGAE', 'Account,Bear__c,Idea,Knowledge__kav,TimeSlot');

        const [permissionRows, mapOfObjectNames] = await Promise.all([
            getAllPermissionSets(),
            getAllObjectsOfOrg()
        ]);

        this.objectOptions = this.transformObjectIntoLabelAndValue(mapOfObjectNames);
        this.permissionOptions = this.transformPermissionSetsIntoLabelAndValue(permissionRows);
    }

    async computeComparisonResult() {
        if (!this.validations()) {
            return;
        }

        //Field Permission
        const [permOne, permTwo] = await this.getFieldPermissionDetails(this.permIdOne, this.permIdTwo, this.selectedObjects);
        let transformedFieldPermissionOne = this.transformFieldPermissionsArray(permOne);
        let transformedFieldPermissionTwo = this.transformFieldPermissionsArray(permTwo);


        const combinedFieldPermissions = this.combinePermissions(transformedFieldPermissionOne, transformedFieldPermissionTwo, 'Field');
        console.log('COMBINED FIELD' + JSON.stringify(combinedFieldPermissions));

        // Object Permission
        const [objectPermOne, objectPermTwo] = await this.getObjectPermissionDetails(this.permIdOne, this.permIdTwo, this.selectedObjects);
        let transformedObjectPermissionOne = this.transformObjectPermissionsArray(objectPermOne);
        let transformedObjectPermissionTwo = this.transformObjectPermissionsArray(objectPermTwo);

        const combinedObjectPermissions = this.combinePermissions(transformedObjectPermissionOne, transformedObjectPermissionTwo, 'SobjectType');
        console.log('COMBINED Object' + JSON.stringify(combinedObjectPermissions));

        this.permOneName = transformedFieldPermissionOne[0]?.PermissionName;
        this.permTwoName = transformedFieldPermissionTwo[0]?.PermissionName;

        this.fieldComparisonResult = this.compareArraysByField(transformedFieldPermissionOne, transformedFieldPermissionTwo, 'Field');
        let objectComparisonResult = this.compareArraysByField(transformedObjectPermissionOne, transformedObjectPermissionTwo, 'SobjectType');
        // console.log('the object comparison reuslt ' + JSON.stringify(objectComparisonResult));
        // console.log('the fields comparison reuslt ' + JSON.stringify(this.fieldComparisonResult));

        // this.downloadSeparateComparisonFiles();

    }

    async getFieldPermissionDetails(permissionSetIdOne, permissionSetIdTwo, selectedObjects) {
        const [permOne, permTwo] = await Promise.all([
            getAllFieldPermissionByPermissionSetId({ permissionSetId: permissionSetIdOne, objectApiNames: selectedObjects }),
            getAllFieldPermissionByPermissionSetId({ permissionSetId: permissionSetIdTwo, objectApiNames: selectedObjects }),
        ]);
        return [permOne, permTwo];
    }

    async getObjectPermissionDetails(permissionSetIdOne, permissionSetIdTwo, selectedObjects) {
        const [permOne, permTwo] = await Promise.all([
            getAllObjectPermissionByPermissionSetId({ permissionSetId: permissionSetIdOne, objectApiNames: selectedObjects }),
            getAllObjectPermissionByPermissionSetId({ permissionSetId: permissionSetIdTwo, objectApiNames: selectedObjects }),
        ]);
        return [permOne, permTwo];
    }

    transformPermissionSetData(arrayToTransform) {
        let deepCopy = JSON.parse(JSON.stringify(arrayToTransform));
        let transformedArray = deepCopy.map(({ Id, Name, IsOwnedByProfile, Profile }) => {
            let permissionName = '';
            let finalResult = { Id, IsOwnedByProfile, permissionName }
            if (Profile) {
                finalResult.permissionName = Profile.Name
            } else {
                finalResult.permissionName = Name;
            }
            return finalResult;
        });
        return transformedArray;
    }

    transformPermissionSetsIntoLabelAndValue(rawPermissionData) {
        let transformedPermData = this.transformPermissionSetData(rawPermissionData);
        let deepCopy = JSON.parse(JSON.stringify(transformedPermData));
        let transformedArray = deepCopy.map(({ Id, permissionName }) => {
            let result = {};
            result.label = permissionName;
            result.value = Id;
            return result;
        });
        let sortedArray = transformedArray.sort((a, b) => a.label.localeCompare(b.label));
        return sortedArray;
    }

    validations() {
        let isValid = true;
        if (!this.permIdOne || !this.permIdTwo) {
            this.showToastMessage('Error!', 'Please Select Permissions To Compare', 'error');
            isValid = false;
        }
        if (!this.selectedObjects.length) {
            this.showToastMessage('Error!', 'Please Select Atleast One Object To Compare', 'error');
            isValid = false;
        }
        return isValid;
    }

    transformObjectIntoLabelAndValue(objectRawData) {
        let deepCopy = JSON.parse(JSON.stringify(objectRawData));
        let transformedArray = Object.entries(deepCopy).map(([key, value]) => ({ label: key, value: key }));
        let sortedArray = transformedArray.sort((a, b) => a.label.localeCompare(b.label))
        return sortedArray;
    }

    handlePermissionSetOneChange(event) {
        this.permIdOne = event.target.value;
    }

    handlePermissionSetTwoChange(event) {
        this.permIdTwo = event.target.value;
    }

    transformFieldPermissionsArray(arrayToChange) {
        let deepCopy = JSON.parse(JSON.stringify(arrayToChange));
        let transformedArray = deepCopy.map(({ Id, SobjectType, Field, PermissionsRead, PermissionsEdit, PermissionName, Parent }) => {
            PermissionName = '';
            let finalResult = { Id, SobjectType, Field, PermissionsRead, PermissionsEdit, PermissionName }
            if (Parent.Profile) {
                finalResult.PermissionName = Parent.Profile.Name
            } else {
                finalResult.PermissionName = Parent.Name;
            }
            return finalResult;
        });
        return transformedArray;
    }
    transformObjectPermissionsArray(arrayToChange) {
        let deepCopy = JSON.parse(JSON.stringify(arrayToChange));
        let transformedArray = deepCopy.map(({ Id, SobjectType, Field, PermissionName, Parent, PermissionsRead, PermissionsEdit, PermissionsCreate, PermissionsDelete, PermissionsViewAllRecords, PermissionsModifyAllRecords }) => {
            let finalResult = { Id, SobjectType, Field, PermissionName, PermissionsRead, PermissionsEdit, PermissionsCreate, PermissionsDelete, PermissionsViewAllRecords, PermissionsModifyAllRecords }
            if (Parent.Profile) {
                finalResult.PermissionName = Parent.Profile.Name
            } else {
                finalResult.PermissionName = Parent.Name;
            }
            return finalResult;
        });
        return transformedArray;
    }

    compareArraysByField(array1, array2, key) {
        const result = {
            same: [],
            inFirstOnly: [],
            inSecondOnly: [],
            different: [],
        };

        const map1 = new Map(array1.map(item => [item[key], item]));
        const map2 = new Map(array2.map(item => [item[key], item]));

        for (const item1 of array1) {
            const item2 = map2.get(item1[key]);

            if (item2) {
                if (this.isEqual(item1, item2)) {
                    result.same.push(item1);
                } else {
                    result.different.push({ first: item1, second: item2 });
                }
            } else {
                result.inFirstOnly.push(item1);
            }
        }

        for (const item2 of array2) {
            const item1 = map1.get(item2[key]);
            if (!item1) {
                result.inSecondOnly.push(item2);
            }
        }

        return result;
    }


    isEqual(obj1, obj2) {
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);

        const allowedToCompareFields = ['SobjectType', 'Field', 'PermissionsRead', 'PermissionsEdit', 'PermissionsCreate', 'PermissionsDelete', 'PermissionsViewAllRecords', 'PermissionsModifyAllRecords'];
        if (keys1.length !== keys2.length) {
            return false;
        }

        for (const key of keys1) {
            if (allowedToCompareFields.includes(key) && obj1[key] !== obj2[key]) {
                return false;
            }
        }

        return true;
    }


    separateFileTransform(x) {
        if (!x) {
            return;
        }
        let y = {
            first: [],
            second: []
        };
        x.forEach(item => {
            const { Id: _, PermissionName: __, ...firstItem } = item.first;
            const { Id: ___, PermissionName: ____, ...secondItem } = item.second;

            y.first.push(firstItem);
            y.second.push(secondItem);
        });
        return y;
    }

    downloadSeparateComparisonFiles() {
        let separatedData = this.separateFileTransform(this.fieldComparisonResult.different);
        let firstFileData = separatedData?.first;
        let secondFileData = separatedData?.second;
        let availableInFirst = this.fieldComparisonResult.inFirstOnly;
        let availableInSecond = this.fieldComparisonResult.inSecondOnly;

        if (firstFileData.length > 0) {
            this.downloadObjectAsJson(firstFileData, this.permOneName, false);
        }
        if (secondFileData.length > 0) {
            this.downloadObjectAsJson(secondFileData, this.permTwoName, false);
        }
        if (availableInFirst.length > 0) {
            this.downloadObjectAsJson(availableInFirst, `OnlyAvailableIn${this.permOneName}`, false);
        }
        if (availableInSecond.length > 0) {
            this.downloadObjectAsJson(availableInSecond, `OnlyAvailableIn${this.permTwoName}`, false);
        }
    }

    downloadObjectAsJson(dataToDownload, fileNameOfExport, isXMLFile) {
        let downloadAnchorNode = document.createElement('a');
        let dataStr;
        if (isXMLFile) {
            dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(dataToDownload);
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", fileNameOfExport + ".xml");
        } else {
            dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToDownload, null, 4));
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", fileNameOfExport + ".json");
        }

        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }

    showToastMessage(title, message, variant) {
        const toastEvent = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant, // Possible values: 'success', 'warning', 'error', or 'info'
        });
        this.dispatchEvent(toastEvent);
    }

    handleObjectChange(e) {
        let selectionArray = [];
        e.detail.forEach(currentItem => {
            selectionArray.push(currentItem.value);
        });
        this.selectedObjects = selectionArray;
    }

    combinePermissions(permissionData1, permissionData2, key) {
        const combinedPermissions = {};
        // const permissionSetOneName = permissionData1[0].PermissionName.replace(/ /g, '');
        // const permissionSetTwoName = permissionData2[0].PermissionName.replace(/ /g, '');
        const permissionSetOneName = 'PermissionSetOne';
        const permissionSetTwoName = 'PermissionSetTwo';

        // Iterate through the first permission array
        for (const permission of permissionData1) {
            let keySeparator = permission[key];
            if (key === 'Field') {
                this.updateFieldPermission(combinedPermissions, permission, keySeparator, permissionSetOneName, permissionSetTwoName);
            } else {
                this.updateObjectPermission(combinedPermissions, permission, keySeparator, permissionSetOneName, permissionSetTwoName);
            }
        }

        // Iterate through the second permission array
        for (const permission of permissionData2) {
            let keySeparator = permission[key];
            if (key === 'Field') {
                this.updateFieldPermission(combinedPermissions, permission, keySeparator, permissionSetOneName, permissionSetTwoName);
            } else {
                this.updateObjectPermission(combinedPermissions, permission, keySeparator, permissionSetOneName, permissionSetTwoName);
            }
        }

        // Convert the combined permissions object into an array
        const combinedPermissionsArray = Object.values(combinedPermissions);

        return combinedPermissionsArray;
    }

    // Helper function to update the combined permissions
    updateFieldPermission(combinedPermissions, permission, fieldKey, permissionSetOneName, permissionSetTwoName) {
        if (!combinedPermissions[fieldKey]) {
            combinedPermissions[fieldKey] = {
                SobjectType: permission.SobjectType,
                Field: permission.Field,
                [`${permissionSetOneName}PermissionsRead`]: false,
                [`${permissionSetOneName}PermissionsEdit`]: false,
                [`${permissionSetTwoName}PermissionsRead`]: false,
                [`${permissionSetTwoName}PermissionsEdit`]: false,
            };
        }
        const permissionSetName = permission.PermissionName.replace(/ /g, '');

        // Remove spaces from PermissionName and convert to camelCase

        combinedPermissions[fieldKey][`${permissionSetName}PermissionsRead`] = permission.PermissionsRead;
        combinedPermissions[fieldKey][`${permissionSetName}PermissionsEdit`] = permission.PermissionsEdit;
    }
    updateObjectPermission(combinedPermissions, permission, fieldKey, permissionSetOneName, permissionSetTwoName) {
        if (!combinedPermissions[fieldKey]) {
            combinedPermissions[fieldKey] = {
                SobjectType: permission.SobjectType,
                Field: permission.Field,
                [`${permissionSetOneName}PermissionsRead`]: false,
                [`${permissionSetOneName}PermissionsEdit`]: false,
                [`${permissionSetOneName}PermissionsCreate`]: false,
                [`${permissionSetOneName}PermissionsDelete`]: false,
                [`${permissionSetOneName}PermissionsViewAllRecords`]: false,
                [`${permissionSetOneName}PermissionsModifyAllRecords`]: false,
                [`${permissionSetTwoName}PermissionsRead`]: false,
                [`${permissionSetTwoName}PermissionsEdit`]: false,
                [`${permissionSetTwoName}PermissionsCreate`]: false,
                [`${permissionSetTwoName}PermissionsDelete`]: false,
                [`${permissionSetTwoName}PermissionsViewAllRecords`]: false,
                [`${permissionSetTwoName}PermissionsModifyAllRecords`]: false,
            };
        }
        const permissionSetName = permission.PermissionName.replace(/ /g, '');

        // Remove spaces from PermissionName and convert to camelCase

        combinedPermissions[fieldKey][`${permissionSetName}PermissionsRead`] = permission.PermissionsRead;
        combinedPermissions[fieldKey][`${permissionSetName}PermissionsEdit`] = permission.PermissionsEdit;
        combinedPermissions[fieldKey][`${permissionSetName}PermissionsCreate`] = permission.PermissionsCreate;
        combinedPermissions[fieldKey][`${permissionSetName}PermissionsDelete`] = permission.PermissionsDelete;
        combinedPermissions[fieldKey][`${permissionSetName}PermissionsViewAllRecords`] = permission.PermissionsViewAllRecords;
        combinedPermissions[fieldKey][`${permissionSetName}PermissionsModifyAllRecords`] = permission.PermissionsModifyAllRecords;
    }
}