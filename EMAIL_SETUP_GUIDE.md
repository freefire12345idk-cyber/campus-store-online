# Gmail SMTP Setup Guide for OTP Emails

## 🔧 **Required Gmail Setup**

### **1. Enable 2-Step Verification**
1. Go to: https://myaccount.google.com/security
2. Enable "2-Step Verification" if not already enabled

### **2. Create App Password**
1. Go to: https://myaccount.google.com/apppasswords
2. Select "Mail" for the app
3. Give it a name like "Campus Store OTP"
4. Click "Generate"
5. **Copy the 16-character password** (this is your EMAIL_PASS)

### **3. Update .env.local**
```env
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="the-16-character-app-password-here"
```

### **4. Enable Less Secure Apps (Alternative)**
If App Password doesn't work:
1. Go to: https://myaccount.google.com/lesssecureapps
2. Turn ON "Allow less secure apps"
3. **Use your regular Gmail password** (not app password)

## 🚀 **Alternative Email Services**

### **Option 1: SendGrid**
```env
EMAIL_HOST="smtp.sendgrid.net"
EMAIL_PORT=587
EMAIL_USER="apikey"
EMAIL_PASS="your-sendgrid-api-key"
```

### **Option 2: Mailgun**
```env
EMAIL_HOST="smtp.mailgun.org"
EMAIL_PORT=587
EMAIL_USER="postmaster@your-domain.com"
EMAIL_PASS="your-mailgun-password"
```

### **Option 3: Brevo (Sendinblue)**
```env
EMAIL_HOST="smtp-relay.sendinblue.com"
EMAIL_PORT=587
EMAIL_USER="your-brevo-email"
EMAIL_PASS="your-brevo-api-key"
```

## 🔍 **Debug Commands**

### **Test Email Config**
Run this in your browser:
```
http://localhost:3000/api/debug/tokens?email=your-email@gmail.com
```

### **Check Console Logs**
1. Open browser dev tools (F12)
2. Go to Console tab
3. Try sending OTP
4. Look for these logs:
   - `=== Email Configuration Debug ===`
   - `✅ Transporter is ready to send emails`
   - `✅ Email sent successfully!`

## ⚠️ **Common Issues & Solutions**

### **Issue: "Invalid login"**
- **Solution**: Use App Password, not regular password
- **Check**: EMAIL_PASS is exactly 16 characters

### **Issue: "Connection timeout"**
- **Solution**: Check firewall/antivirus blocking port 587
- **Try**: Different network or use port 465 with secure: true

### **Issue: "5.7.14 Please log in via your web browser"**
- **Solution**: Enable "Less secure apps" or use App Password
- **Link**: https://myaccount.google.com/lesssecureapps

### **Issue: "DNS resolution failed"**
- **Solution**: Check EMAIL_HOST spelling
- **Correct**: smtp.gmail.com (not gmail.smtp.com)

## 🧪 **Quick Test**

Add this to your browser console to test:
```javascript
fetch('/api/auth/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    action: 'send', 
    email: 'your-email@gmail.com' 
  })
}).then(r => r.json()).then(console.log)
```

## 📱 **Mobile Setup**

If on mobile/limited access:
1. Use **SendGrid** (easier setup)
2. Or use **temp-mail services** for testing
3. Check if **port 587** is blocked by ISP

## 🔐 **Security Notes**

- **Never commit** .env.local to git
- **Use App Passwords** for production
- **Monitor** email sending limits
- **Rotate** passwords periodically
