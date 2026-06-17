<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ReferralNotification extends Notification
{

    public function __construct(
        private string $message,
        private string $referralId,
        private string $referralNumber,
        private string $action,
        private string $fromFacility = '',
        private string $toFacility   = '',
        private string $patientName  = ''
    ) {}

    public function via(object $notifiable): array
    {
        if ($notifiable instanceof \Illuminate\Notifications\AnonymousNotifiable) {
            return ['mail'];
        }
        return ['database', 'mail'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'message'          => $this->message,
            'referral_id'      => $this->referralId,
            'referral_number'  => $this->referralNumber,
            'action'           => $this->action,
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $actionLabels = [
            'created'      => 'New Referral Received',
            'acknowledged' => 'Referral Acknowledged',
            'in_transit'   => 'Patient In Transit',
            'received'     => 'Patient Arrived',
            'completed'    => 'Referral Completed',
            'cancelled'    => 'Referral Cancelled',
            'feedback'     => 'Feedback Submitted',
        ];

        $subject = ($actionLabels[$this->action] ?? 'Referral Update')
            . ' — ' . $this->referralNumber;

        $appUrl  = env('FRONTEND_URL', config('app.url', 'http://localhost:5173'));
        $link    = rtrim($appUrl, '/') . '/referrals/' . $this->referralId;

        $mail = (new MailMessage)
            ->subject($subject)
            ->greeting('Hello ' . ($notifiable->name ?? 'there') . ',')
            ->line($this->message);

        if ($this->patientName) {
            $mail->line('**Patient:** ' . $this->patientName);
        }
        if ($this->fromFacility) {
            $mail->line('**From:** ' . $this->fromFacility);
        }
        if ($this->toFacility) {
            $mail->line('**To:** ' . $this->toFacility);
        }

        $mail->action('View Referral', $link)
             ->line('This is an automated notification from the DRCP Uganda Digital Referral Platform.')
             ->salutation('DRCP Uganda Team');

        return $mail;
    }
}
