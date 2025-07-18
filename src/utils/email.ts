// import nodemailer from "nodemailer";

// const sendEmail = async (options: any) => {
//   const transporter = nodemailer.createTransport({
//     service: "Gmail",
//     auth: {
//       user: process.env.EMAIL_USER,
//       Pass: process.env.EMAIL_PASS,
//     },
//   });
//   const mailOptions = {
//     from: "Mentors Hub <michaelblossom8654@gmail.com>",
//     to: options.email,
//     subject: options.subject,
//     html: options.html,
//     // text: options.message,
//   };
//   // 3)send the Actual email
//   await transporter.sendMail(mailOptions);
// };
import nodemailer from "nodemailer";

const sendEmail = async (options: any) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: "Mentors Hub <michaelblossom8654@gmail.com>",
    to: options.email,
    subject: options.subject,
    html: options.html,
    // text: options.message,
  };

  await transporter.sendMail(mailOptions);
};

export default sendEmail;
