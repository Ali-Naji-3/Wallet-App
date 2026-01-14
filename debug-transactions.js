// Quick debug script to test the transactions API
// Run this in browser console while logged in

(async () => {
    try {
        // Get token from sessionStorage
        const token = sessionStorage.getItem('fxwallet_token');
        console.log('Token exists:', !!token);

        if (!token) {
            console.error('❌ No token found - you need to login first!');
            return;
        }

        // Test API call
        const response = await fetch('/api/transactions/my', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('API Status:', response.status);
        const data = await response.json();
        console.log('API Response:', data);

        if (data.transactions) {
            console.log(`✅ Found ${data.transactions.length} transactions`);
            console.log('First transaction:', data.transactions[0]);
        } else {
            console.log('❌ No transactions in response');
        }
    } catch (error) {
        console.error('❌ Error:', error);
    }
})();
