interface SecurityAuditLog {
  user_id: string;
  challenge_id: string;
  action_type: 'answer_submission' | 'timing_anomaly' | 'rate_limit_hit' | 'duplicate_submission';
  details: string;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class SecurityAuditor {
  static async logSecurityEvent(
    supabase: unknown,
    userId: string,
    challengeId: string,
    actionType: SecurityAuditLog['action_type'],
    details: string,
    severity: SecurityAuditLog['severity'] = 'medium',
    request?: Request
  ) {
    try {
      const auditLog: SecurityAuditLog = {
        user_id: userId,
        challenge_id: challengeId,
        action_type: actionType,
        details,
        ip_address: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || 'unknown',
        user_agent: request?.headers.get('user-agent') || 'unknown',
        timestamp: new Date().toISOString(),
        severity
      };

      // Log to console for now (in production, send to monitoring service)
      console.log(`[SECURITY AUDIT] ${severity.toUpperCase()}: ${actionType}`, auditLog);

      // Could store in database, send to monitoring service, etc.
      // await supabase.from('security_audit_logs').insert(auditLog);
      
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  static async flagSuspiciousUser(
    supabase: unknown,
    userId: string,
    challengeId: string,
    reason: string,
    request?: Request
  ) {
    await this.logSecurityEvent(
      supabase,
      userId,
      challengeId,
      'timing_anomaly',
      `FLAGGED USER: ${reason}`,
      'high',
      request
    );

    // In production, could:
    // - Temporarily restrict user actions
    // - Require additional verification
    // - Alert administrators
    console.warn(`⚠️ FLAGGED USER ${userId} in challenge ${challengeId}: ${reason}`);
  }
}
