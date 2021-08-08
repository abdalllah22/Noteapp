const sgMail = require('@sendgrid/mail')

 

sgMail.setApiKey(process.env.SENDGRID_API_KEY)


const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email, 
        from: 'ahmed.abdalllah22@gmail.com', 
        subject: 'Welcoming Mail',
        html: `<strong> 
                Dear ${name}, 
                Thank you for joining. 
                We will review your application and contact you shortly. 
                Best regards
                </strong>`,
    })
    
}

const sendCancelEmail = (email, name) => {
    sgMail.send({
        to: email, 
        from: 'ahmed.abdalllah22@gmail.com', 
        subject: 'GoodBye Mail',
        html: `<strong> 
                Dear ${name}, 
                Goob Bye.  
                Best regards
                </strong>`,
    })
    
}


module.exports = {
    sendWelcomeEmail,
    sendCancelEmail

}









