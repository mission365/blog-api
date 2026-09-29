using System.Net;
using System.Net.Mail;

namespace BlogApi.Services
{
    public interface IEmailService
    {
        Task SendVerificationEmailAsync(string toEmail, string code);
        Task SendPasswordResetEmailAsync(string toEmail, string code);
    }

    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration config, ILogger<EmailService> logger)
        {
            _config = config;
            _logger = logger;
        }

        public async Task SendVerificationEmailAsync(string toEmail, string code)
        {
            var subject = "PulseBlog — Email Verification Code";
            var body = $@"
<div style=""font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 28px; background: #0b0f19; color: #f8fafc; border-radius: 16px; border: 1px solid #1e293b;"">
    <div style=""text-align: center; margin-bottom: 24px;"">
        <h1 style=""color: #6366f1; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;"">PulseBlog</h1>
        <p style=""color: #94a3b8; font-size: 13px; margin-top: 4px;"">Account Verification</p>
    </div>
    <div style=""background: #111827; padding: 24px; border-radius: 12px; border: 1px solid #1f2937; text-align: center;"">
        <p style=""color: #e2e8f0; font-size: 14px; margin-bottom: 16px; line-height: 1.5;"">
            Thank you for registering! Please use the 6-digit confirmation code below to verify your email address and activate your author profile:
        </p>
        <div style=""font-size: 32px; font-family: 'Courier New', monospace; font-weight: 700; letter-spacing: 8px; color: #818cf8; background: #030712; padding: 14px 28px; border-radius: 10px; border: 1px solid #374151; display: inline-block; margin: 16px 0;"">
            {code}
        </div>
        <p style=""color: #64748b; font-size: 12px; margin-top: 16px; line-height: 1.4;"">
            This code will expire in 15 minutes. If you did not create an account on PulseBlog, please ignore this email.
        </p>
    </div>
</div>";
            await SendEmailAsync(toEmail, subject, body);
        }

        public async Task SendPasswordResetEmailAsync(string toEmail, string code)
        {
            var subject = "PulseBlog — Password Reset Code";
            var body = $@"
<div style=""font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 28px; background: #0b0f19; color: #f8fafc; border-radius: 16px; border: 1px solid #1e293b;"">
    <div style=""text-align: center; margin-bottom: 24px;"">
        <h1 style=""color: #6366f1; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;"">PulseBlog</h1>
        <p style=""color: #94a3b8; font-size: 13px; margin-top: 4px;"">Password Recovery</p>
    </div>
    <div style=""background: #111827; padding: 24px; border-radius: 12px; border: 1px solid #1f2937; text-align: center;"">
        <p style=""color: #e2e8f0; font-size: 14px; margin-bottom: 16px; line-height: 1.5;"">
            We received a request to reset your PulseBlog password. Enter the 6-digit recovery code below in the password reset form:
        </p>
        <div style=""font-size: 32px; font-family: 'Courier New', monospace; font-weight: 700; letter-spacing: 8px; color: #fbbf24; background: #030712; padding: 14px 28px; border-radius: 10px; border: 1px solid #374151; display: inline-block; margin: 16px 0;"">
            {code}
        </div>
        <p style=""color: #64748b; font-size: 12px; margin-top: 16px; line-height: 1.4;"">
            This code will expire in 15 minutes. If you did not request this password reset, please ignore this email and your password will remain unchanged.
        </p>
    </div>
</div>";
            await SendEmailAsync(toEmail, subject, body);
        }

        private async Task SendEmailAsync(string toEmail, string subject, string htmlBody)
        {
            var host = _config["Smtp:Host"]?.Trim();
            var portStr = _config["Smtp:Port"]?.Trim();
            var username = _config["Smtp:Username"]?.Trim();
            var password = _config["Smtp:Password"]?.Replace(" ", "").Trim();
            var senderEmail = _config["Smtp:SenderEmail"]?.Trim() ?? username ?? "no-reply@pulseblog.com";
            var senderName = _config["Smtp:SenderName"]?.Trim() ?? "PulseBlog";
            var enableSsl = bool.TryParse(_config["Smtp:EnableSsl"], out var ssl) ? ssl : true;
            var port = int.TryParse(portStr, out var p) ? p : 587;

            if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
            {
                _logger.LogWarning("[EMAIL SERVICE] SMTP is not fully configured in appsettings.json. Unable to dispatch email to: {toEmail}", toEmail);
                return;
            }

            try
            {
                using var client = new SmtpClient(host, port)
                {
                    EnableSsl = enableSsl,
                    UseDefaultCredentials = false,
                    Credentials = new NetworkCredential(username, password),
                    DeliveryMethod = SmtpDeliveryMethod.Network,
                    Timeout = 20000
                };

                using var mailMessage = new MailMessage
                {
                    From = new MailAddress(senderEmail, senderName),
                    Subject = subject,
                    Body = htmlBody,
                    IsBodyHtml = true
                };

                mailMessage.To.Add(toEmail);
                await client.SendMailAsync(mailMessage);
                _logger.LogInformation("[EMAIL SERVICE] Email successfully dispatched to {toEmail}", toEmail);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[EMAIL SERVICE] Error delivering email to {toEmail}: {Message}", toEmail, ex.Message);
            }
        }
    }
}
