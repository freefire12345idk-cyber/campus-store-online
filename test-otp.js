// Test OTP System - Run in browser console
// 1. Test Database Connection
fetch('/api/test-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    email: 'test@example.com' 
  })
})
.then(r => r.json())
.then(data => {
  console.log('🧪 Database Test Result:', data);
  
  if (data.success) {
    console.log('✅ Database working!');
    console.log('🧪 Test OTP:', data.otp);
    
    // 2. Test Email Sending with real email
    fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'send', 
        email: 'your-actual-email@gmail.com' // Replace with your email
      })
    })
    .then(r => r.json())
    .then(emailResult => {
      console.log('📧 Email Test Result:', emailResult);
      
      if (emailResult.error) {
        console.error('❌ Email failed:', emailResult.error);
        console.error('❌ Details:', emailResult.details);
      } else {
        console.log('✅ Email sent! Check your inbox.');
        console.log('🧪 If you see OTP in console but not email, Gmail setup issue.');
      }
    });
  } else {
    console.error('❌ Database test failed:', data);
  }
})
.catch(error => {
  console.error('🧪 Test failed:', error);
});

// 3. Check Environment Variables
console.log('🔍 Checking environment...');
console.log('Current URL:', window.location.origin);

// 4. Manual OTP Verification Test
// Use the OTP from console to test verification
fetch('/api/auth/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    action: 'verify', 
    email: 'test@example.com',
    token: '123456' // Replace with actual OTP
  })
})
.then(r => r.json())
.then(verifyResult => {
  console.log('🔐 Verification Test:', verifyResult);
});
