import { LightningElement, track, api } from 'lwc';
import getAllFieldPermissionByPermissionSetId from "@salesforce/apex/PermissionSetCompareUtility.getAllFieldPermissionByPermissionSetId";
import getAllObjectsOfOrg from "@salesforce/apex/PermissionSetCompareUtility.getAllObjectsOfOrg";
import getAllPermissionSets from "@salesforce/apex/PermissionSetCompareUtility.getAllPermissionSets";
import { ShowToastEvent } from 'lightning/platformShowToastEvent';


const fieldDiffColumns = [
    { label: 'Object', fieldName: 'SobjectType' },
    { label: 'Api Name', fieldName: 'Field' },
    { label: 'Permission One Read', fieldName: 'firstPermissionsRead' },
    { label: 'Permission Two Read', fieldName: 'secondPermissionsRead' },
    { label: 'Permission One Edit', fieldName: 'firstPermissionsEdit' },
    { label: 'Permission Two Edit', fieldName: 'secondPermissionsEdit' }
];

export default class PermissionSetCompare extends LightningElement {
    @track result = '';
    @track permOne = [];
    @track permTwo = [];
    @track objectOptions;
    @track permissionOptions = [];
    @track selectedObjects = [];
    @api permIdOne;
    @api permIdTwo;
    @track comparisonResult;

    @track permOneName;
    @track permTwoName;


    // Comparison Result 
    @track diff

    //Not used
    @track differenceData;
    @track differenceColumns = fieldDiffColumns;
    @track objectApiString;
    // Not Used End


    setTestData(one, two, obj) {
        this.permIdOne = one;
        this.permIdTwo = two;
        this.objectApiString = obj;
        this.selectedObjects = this.objectApiString.split(',');
    }

    async connectedCallback() {
        // this.setTestData('0PS2x000001bM3aGAE', '0PS2x000001bM3GGAU', 'Account,Bear__c');
        //this.selectedObjects = ['Account','Bear__c'];

        const [permissionRows, mapOfObjectNames] = await Promise.all([
            getAllPermissionSets(),
            getAllObjectsOfOrg()
        ]);

        this.objectOptions = this.transformObjectIntoLabelAndValue(mapOfObjectNames);
        this.permissionOptions = this.transformPermissionIntoLabelAndValue(permissionRows);
    }

    async computeComparisonResult() {
        this.validations();

        const [permOne, permTwo] = await this.getPermissionDetails(this.permIdOne, this.permIdTwo, this.selectedObjects);
        let transformedPermissionOne = this.transformArray(permOne);
        let transformedPermissionTwo = this.transformArray(permTwo);

        
        this.permOneName = transformedPermissionOne[0]?.PermissionName;
        this.permTwoName = transformedPermissionTwo[0]?.PermissionName;

        this.comparisonResult = this.compareArraysByField(transformedPermissionOne, transformedPermissionTwo);

        this.downloadSeparateComparisonFiles();

    }

    async getPermissionDetails(permissionSetIdOne, permissionSetIdTwo, selectedObjects) {
        const [permOne, permTwo] = await Promise.all([
            getAllFieldPermissionByPermissionSetId({ permissionSetId: permissionSetIdOne, objectApiNames: selectedObjects }),
            getAllFieldPermissionByPermissionSetId({ permissionSetId: permissionSetIdTwo, objectApiNames: selectedObjects }),
        ]);
        return [permOne, permTwo];
    }

    transformPermissionData(arrayToTransform) {
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

    transformPermissionIntoLabelAndValue(rawPermissionData) {
        let transformedPermData = this.transformPermissionData(rawPermissionData);
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
        if (!this.permIdOne || !this.permIdTwo) {
            this.showToastMessage('Error!', 'Please Select Permissions To Compare', 'error');
            return;
        }
        if (!this.selectedObjects.length) {
            this.showToastMessage('Error!', 'Please Select Objects To Compare', 'error');
            return;
        }
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

    handleObjectChange(event) {
        let valueOfObjects = event.target.value;
        this.selectedObjects = valueOfObjects;
    }

    transformArray(arrayToChange) {
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

    compareArraysByField(array1, array2) {
        const result = {
            same: [],
            inFirstOnly: [],
            inSecondOnly: [],
            different: [],
        };

        const map1 = new Map(array1.map(item => [item.Field, item]));
        const map2 = new Map(array2.map(item => [item.Field, item]));

        for (const item1 of array1) {
            const item2 = map2.get(item1.Field);

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
            const item1 = map1.get(item2.Field);
            if (!item1) {
                result.inSecondOnly.push(item2);
            }
        }

        return result;
    }


    isEqual(obj1, obj2) {
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);

        const allowedToCompareFields = ['SobjectType', 'Field', 'PermissionsRead', 'PermissionsEdit'];
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

    dataTableTransform(inputArray) {
        const convertedArray = [];
        inputArray.forEach(item => {
            const firstItem = {
                SobjectType: item.first.SobjectType,
                Field: item.first.Field,
                firstPermissionsRead: item.first.PermissionsRead,
                firstPermissionsEdit: item.first.PermissionsEdit,
                PermissionName: item.first.PermissionName
            };

            const secondItem = {
                SobjectType: item.second.SobjectType,
                Field: item.second.Field,
                secondPermissionsRead: item.second.PermissionsRead,
                secondPermissionsEdit: item.second.PermissionsEdit,
                PermissionName: item.second.PermissionName
            };

            convertedArray.push(firstItem, secondItem);
        });
        return convertedArray;
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
        let separatedData = this.separateFileTransform(this.comparisonResult.different);
        let firstFileData = separatedData?.first;
        let secondFileData = separatedData?.second;
        let availableInFirst = this.comparisonResult.inFirstOnly;
        let availableInSecond = this.comparisonResult.inSecondOnly;

        if (firstFileData.length > 0) {
            this.downloadObjectAsJson(firstFileData, this.permOneName, false);
        }
        if (secondFileData.length > 0) {
            this.downloadObjectAsJson(secondFileData, this.permTwoName, false);
        }
        if (availableInFirst.length > 0) {
            this.downloadObjectAsJson(availableInFirst, `AvailableIn${this.permOneName}`, false);
        }
        if (availableInSecond.length > 0) {
            this.downloadObjectAsJson(availableInSecond, `AvailableIn${this.permTwoName}`, false);
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

    // transformArray(arrayToChange) {
    //     let deepCopy = JSON.parse(JSON.stringify(arrayToChange));
    //     let transformedArray = deepCopy.map(({ SobjectType, Field, PermissionsRead, PermissionsEdit, PermissionName, Parent }) => {
    //         PermissionName = '';
    //         let finalResult = { SobjectType, Field, PermissionsRead, PermissionsEdit, PermissionName }
    //         if (Parent.Profile) {
    //             finalResult.PermissionName = Parent.Profile.Name
    //         } else {
    //             finalResult.PermissionName = Parent.Name;
    //         }
    //         return finalResult;
    //     });
    //     return transformedArray;
    // }
    showToastMessage(title, message, variant) {
        const toastEvent = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant, // Possible values: 'success', 'warning', 'error', or 'info'
        });
        this.dispatchEvent(toastEvent);
    }


}