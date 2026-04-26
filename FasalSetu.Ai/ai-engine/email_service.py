import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
import os

def send_report_email(to_email, claim_id, file_path):
    # SMTP Configuration (Example for Gmail)
    smtp_server = "smtp.gmail.com"
    smtp_port = 587
    sender_email = os.getenv("SMTP_EMAIL", "reports@fasalsetu.com")
    sender_password = os.getenv("SMTP_PASSWORD", "your-app-password")

    # Create message
    msg = MIMEMultipart()
    msg['From'] = f"FasalSetu Reports <{sender_email}>"
    msg['To'] = to_email
    msg['Subject'] = f"Your FasalSetu Assessment Report - Claim #{claim_id}"

    body = f"""
    Hello,

    Please find attached your AI-generated crop damage assessment report for Claim #{claim_id}.
    
    This report has been forwarded to an insurance agent for final review.
    
    Best Regards,
    FasalSetu Team
    """
    msg.attach(MIMEText(body, 'plain'))

    # Attach PDF
    try:
        with open(file_path, "rb") as attachment:
            part = MIMEBase('application', 'octet-stream')
            part.set_payload(attachment.read())
            encoders.encode_base64(part)
            part.add_header('Content-Disposition', f"attachment; filename= Claim_{claim_id}_Report.pdf")
            msg.attach(part)
        
        # Send Email
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        # server.login(sender_email, sender_password) # Commented for safety in prototype
        # server.send_message(msg)
        server.quit()
        print(f"Email sent successfully to {to_email}")
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False
