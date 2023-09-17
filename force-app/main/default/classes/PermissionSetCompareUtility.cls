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

        // for (PermissionSet ps : permissionSets) {
        //     if (ps.IsOwnedByProfile) {
        //         result.put(ps.Id, ps.Profile.Name);
        //     } else {
        //         result.put(ps.Id, ps.Name);
        //     }
        // }

        return permissionSets;
    }
}