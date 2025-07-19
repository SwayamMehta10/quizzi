// Debug script to test friends page loading
console.log('Testing friends page authentication and data loading...');

// This script can be run in the browser console to debug the issues
const testAuth = async () => {
    const { createClient } = await import('./src/utils/supabase/client.js');
    const supabase = createClient();
    
    console.log('Testing auth...');
    const { data: { user }, error } = await supabase.auth.getUser();
    console.log('User:', user);
    console.log('Auth error:', error);
    
    if (user) {
        console.log('Testing OptimizedQueries...');
        const { OptimizedQueries } = await import('./src/lib/optimized-queries.js');
        
        try {
            const friends = await OptimizedQueries.getFriendsOptimized(user.id);
            console.log('Friends:', friends);
            
            const requests = await OptimizedQueries.getPendingRequestsOptimized(user.id);
            console.log('Pending requests:', requests);
        } catch (error) {
            console.error('OptimizedQueries error:', error);
        }
    }
};

// Run test
testAuth();
