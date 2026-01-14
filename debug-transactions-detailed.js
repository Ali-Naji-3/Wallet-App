// Enhanced debug script - paste this in browser console
console.log('=== TRANSACTION DEBUG ===');

// Get React component state (if available)
const pageElement = document.querySelector('[data-transactions]');
console.log('Page element:', pageElement);

// Check sessionStorage
const token = sessionStorage.getItem('fxwallet_token');
console.log('✅ Token exists:', !!token);

// Fetch and log transactions
fetch('/api/transactions/my', {
    headers: { 'Authorization': `Bearer ${token}` }
})
    .then(r => r.json())
    .then(data => {
        console.log('📦 API Response:', data);
        console.log('📊 Transaction count:', data.transactions?.length || 0);

        if (data.transactions && data.transactions.length > 0) {
            console.log('🔍 First transaction details:');
            const tx = data.transactions[0];
            console.log({
                id: tx.id,
                type: tx.transaction_type,
                description: tx.description,
                sender_name: tx.sender_name,
                recipient_name: tx.recipient_name,
                amount: tx.amount,
                currency: tx.currency,
                category: tx.category,
                status: tx.status,
                created_at: tx.created_at
            });

            console.log('🔍 Second transaction details:');
            if (data.transactions[1]) {
                const tx2 = data.transactions[1];
                console.log({
                    id: tx2.id,
                    type: tx2.transaction_type,
                    description: tx2.description,
                    sender_name: tx2.sender_name,
                    recipient_name: tx2.recipient_name,
                    amount: tx2.amount,
                    currency: tx2.currency,
                    category: tx2.category,
                    status: tx2.status,
                    created_at: tx2.created_at
                });
            }
        }
    })
    .catch(err => console.error('❌ Error:', err));
