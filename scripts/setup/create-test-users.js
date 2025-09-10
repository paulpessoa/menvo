// Script to create test users for backup/restore testing
const { createClient } = require('@supabase/supabase-js');

// Local Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestUsers() {
    console.log('🔄 Creating test users for backup/restore testing...');
    
    try {
        // Test users data
        const testUsers = [
            {
                email: 'mentor1@test.com',
                password: 'testpass123',
                profile: {
                    first_name: 'João',
                    last_name: 'Silva',
                    full_name: 'João Silva',
                    role: 'mentor',
                    bio: 'Experienced software developer and mentor',
                    expertise_areas: ['JavaScript', 'React', 'Node.js'],
                    is_available: true
                }
            },
            {
                email: 'mentee1@test.com',
                password: 'testpass123',
                profile: {
                    first_name: 'Maria',
                    last_name: 'Santos',
                    full_name: 'Maria Santos',
                    role: 'mentee',
                    bio: 'Aspiring developer looking for guidance',
                    is_available: true
                }
            },
            {
                email: 'admin@test.com',
                password: 'testpass123',
                profile: {
                    first_name: 'Admin',
                    last_name: 'User',
                    full_name: 'Admin User',
                    role: 'admin',
                    bio: 'System administrator',
                    is_available: true
                }
            }
        ];

        console.log(`\n📝 Creating ${testUsers.length} test users...`);

        for (const userData of testUsers) {
            console.log(`\n👤 Creating user: ${userData.email}`);
            
            // Create auth user
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
                email: userData.email,
                password: userData.password,
                email_confirm: true
            });

            if (authError) {
                console.log(`❌ Failed to create auth user: ${authError.message}`);
                continue;
            }

            console.log(`✅ Auth user created with ID: ${authUser.user.id}`);

            // Create profile
            const profileData = {
                id: authUser.user.id,
                email: userData.email,
                ...userData.profile,
                status: 'active',
                verification_status: 'active'
            };

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .insert(profileData)
                .select()
                .single();

            if (profileError) {
                console.log(`❌ Failed to create profile: ${profileError.message}`);
                continue;
            }

            console.log(`✅ Profile created for: ${profile.full_name}`);

            // Assign role
            const { data: roleData } = await supabase
                .from('roles')
                .select('id')
                .eq('name', userData.profile.role)
                .single();

            if (roleData) {
                const { error: roleAssignError } = await supabase
                    .from('user_roles')
                    .insert({
                        user_id: authUser.user.id,
                        role_id: roleData.id,
                        is_primary: true
                    });

                if (roleAssignError) {
                    console.log(`⚠️  Failed to assign role: ${roleAssignError.message}`);
                } else {
                    console.log(`✅ Role '${userData.profile.role}' assigned`);
                }
            }
        }

        // Verify creation
        console.log('\n📊 Verifying test data creation...');
        
        const { data: users } = await supabase.auth.admin.listUsers();
        const { data: profiles } = await supabase.from('profiles').select('*');
        const { data: userRoles } = await supabase.from('user_roles').select('*');

        console.log(`✅ Created ${users.users.length} auth users`);
        console.log(`✅ Created ${profiles.length} profiles`);
        console.log(`✅ Created ${userRoles.length} role assignments`);

        console.log('\n🎉 Test users created successfully!');
        console.log('\nTest users:');
        profiles.forEach(profile => {
            console.log(`  - ${profile.full_name} (${profile.email}) - ${profile.role}`);
        });

    } catch (error) {
        console.log('❌ Failed to create test users:', error.message);
    }
}

createTestUsers();