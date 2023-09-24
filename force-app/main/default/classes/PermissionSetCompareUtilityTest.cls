@isTest
public class PermissionSetCompareUtilityTest {
    
    @isTest
    public static void testGetAllFieldPermissionByPermissionSetId() {
        // Create a test Permission Set
        PermissionSet testPermissionSet = new PermissionSet(
            Name = 'TestPermissionSet',
            Label = 'Test Permission Set' // Set the required "Label" field
        );
        insert testPermissionSet;
        
        // Create test Field Permissions
        FieldPermissions testFieldPermission = new FieldPermissions(
            ParentId = testPermissionSet.Id,
            SobjectType = 'Account',
            Field = 'Account.Active__c',
            PermissionsRead = true,
            PermissionsEdit = true
        );
        insert testFieldPermission;
        
        // Call the method
        List<String> objectApiNames = new List<String>{'Account'};
            List<FieldPermissions> result = PermissionSetCompareUtility.getAllFieldPermissionByPermissionSetId(testPermissionSet.Id, objectApiNames);
        
        // Assert the results
        System.assertEquals(1, result.size());
        System.assertEquals('Account', result[0].SobjectType);
    }
    
    @isTest
    public static void testGetAllObjectPermissionByPermissionSetId() {
        // Create a test Permission Set
        PermissionSet testPermissionSet = new PermissionSet(
            Name = 'TestPermissionSet',
            Label = 'Test Permission Set' // Set the required "Label" field
        );
        insert testPermissionSet;
        
        
        // Create test Object Permissions
        ObjectPermissions testObjectPermission = new ObjectPermissions(
            ParentId = testPermissionSet.Id,
            SobjectType = 'Account',
            PermissionsRead = true,
            PermissionsEdit = true,
            PermissionsCreate = true,
            PermissionsDelete = true
        );
        insert testObjectPermission;
        
        // Call the method
        List<String> objectApiNames = new List<String>{'Account'};
            List<ObjectPermissions> result = PermissionSetCompareUtility.getAllObjectPermissionByPermissionSetId(testPermissionSet.Id, objectApiNames);
        
        // Assert the results
        System.assertEquals(1, result.size());
        System.assertEquals('Account', result[0].SobjectType);
    }
    
    @isTest
    public static void testGetAllObjectsOfOrg() {
        // Call the method
        Map<String, String> result = PermissionSetCompareUtility.getAllObjectsOfOrg();
        
        // Assert the results
        System.assertNotEquals(null, result);
        // You can add more specific assertions based on your org's schema.
    }
    
    @isTest
    public static void testGetAllPermissionSets() {
        // Call the method
        List<PermissionSet> result = PermissionSetCompareUtility.getAllPermissionSets();
        
        // Assert the results
        System.assertNotEquals(null, result);
        // You can add more specific assertions based on your org's data.
    }
}