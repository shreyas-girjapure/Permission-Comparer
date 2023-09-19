public class PermissionSetCompareUtility {

    //PermissionSetCompareUtility.getAllFieldPermissionByPermissionSetId('0PS2x000001bM3aGAE',new List<String>{'Account','Bear__c'});
    @AuraEnabled
    public static List<FieldPermissions> getAllFieldPermissionByPermissionSetId(String permissionSetId,List<String> objectApiNames){

        List<FieldPermissions> fieldPermissions= [select id ,SobjectType,Field, PermissionsRead, PermissionsEdit,Parent.name,Parent.Profile.name  from
        FieldPermissions where ParentId =: permissionSetId and SobjectType 
        in:objectApiNames
        order by SobjectType desc];

        return fieldPermissions;
    }
    //PermissionSetCompareUtility.getAllObjectPermissionByPermissionSetId('0PS2x000001bM3GGAU',new List<String>{'Account','Bear__c'});
    @AuraEnabled
    public static List<ObjectPermissions> getAllObjectPermissionByPermissionSetId(String permissionSetId,List<String> objectApiNames){
        // Ids with prefix '000' are `View All Data` and `Modify All Data` permission of whole org , provided by Setup Permission
        // We dont need those 110 is the correct Id Prefix  

        Map<String,ObjectPermissions> filteredPermissionsByObject = new Map<String,ObjectPermissions>();
        //List<ObjectPermissions> computedResult = new List<ObjectPermissions>();

        List<ObjectPermissions> objectPermissionsList= [Select id , ParentId,Parent.IsOwnedByProfile, Parent.Name, Parent.Profile.name, SobjectType, PermissionsRead, PermissionsEdit, PermissionsCreate, PermissionsDelete, PermissionsViewAllRecords, PermissionsModifyAllRecords  from ObjectPermissions where ParentId =: permissionSetId and SobjectType 
        in:objectApiNames
        order by SobjectType desc];

        for(ObjectPermissions o : objectPermissionsList){
            if(!filteredPermissionsByObject.containsKey(o.SobjectType)){
                filteredPermissionsByObject.put(o.SobjectType,o);
            }else {
                ObjectPermissions existingObjectValue = filteredPermissionsByObject.get(o.SobjectType);
                ObjectPermissions currentObjectValue = o;
                
                String idOfExisitingObject = existingObjectValue.id;
                String idOfCurrentObject = o.id;
                
                if(idOfExisitingObject.startsWith('000') && idOfCurrentObject.startsWith('110')){                    
                    filteredPermissionsByObject.put(o.SobjectType,o);
                }
            }
        }
        for(ObjectPermissions o : filteredPermissionsByObject.values()){
            System.debug( o.SobjectType  + ' ' + o.id);
        }

        return filteredPermissionsByObject.values();
    }

    //PermissionSetCompareUtility.getAllObjectsOfOrg();
    @AuraEnabled
    public static Map<String,String> getAllObjectsOfOrg(){
        Map<String,String> objectKeyAndLabelPair = new Map<String,String>();
        Map<String, Schema.SObjectType> schemaMap = Schema.getGlobalDescribe();
        for (String objectName : schemaMap.keySet()) {

            Schema.SObjectType objType = schemaMap.get(objectName);
            String objectApiName = objType.getDescribe().getName();            
            String objectLabel = objType.getDescribe().getLabel();

            if(!objectKeyAndLabelPair.containsKey(objectApiName) && !objectApiName.containsignorecase('history') && !objectApiName.containsignorecase('tag') && !objectApiName.containsignorecase('share') && !objectApiName.containsignorecase('feed') && !objectApiName.containsignorecase('ChangeEvent')){
                objectKeyAndLabelPair.put(objectApiName,objectLabel);
            }
            
        }
        return objectKeyAndLabelPair;
    }
    //PermissionSetCompareUtility.getAllPermissionSets()
    @AuraEnabled
    public static List<PermissionSet> getAllPermissionSets(){
        Map<String, String> result = new Map<String, String>();
        // Query all Permission Sets
        List<PermissionSet> permissionSets = [SELECT Id, Name, IsOwnedByProfile, Profile.Name FROM PermissionSet];
        return permissionSets;
    }
}