import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, tap } from "rxjs";
import type { Request, Response } from "express";
import { AuditService } from "./audit.service";

const AUDITED_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const SKIP_PATHS = ["/api/health", "/api/auth/refresh", "/api/mail/inbound"];

function inferResource(path: string): {
  resource: string;
  resourceId: string | null;
} {
  const segments = path
    .replace(/^\/api\//, "")
    .split("/")
    .filter(Boolean);
  const resource = segments[0] ?? "unknown";
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const resourceId = segments.find((s) => uuidPattern.test(s)) ?? null;
  return { resource, resourceId };
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const { method, path, ip, headers } = req;

    if (
      !AUDITED_METHODS.has(method) ||
      SKIP_PATHS.some((p) => path.startsWith(p))
    ) {
      return next.handle();
    }

    const { resource, resourceId } = inferResource(path);
    const action = `${method.toLowerCase()}_${resource}`;
    const user = req.user as { id?: string; email?: string } | undefined;

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse<Response>();
          void this.auditService.log({
            actorId: user?.id ?? null,
            actorEmail: user?.email ?? null,
            action,
            resource,
            resourceId,
            ipAddress:
              (ip ?? (headers["x-forwarded-for"] as string) ?? null)
                ?.split(",")[0]
                .trim() ?? null,
            userAgent: headers["user-agent"] ?? null,
            statusCode: res.statusCode,
          });
        },
        error: (err: { status?: number }) => {
          void this.auditService.log({
            actorId: user?.id ?? null,
            actorEmail: user?.email ?? null,
            action,
            resource,
            resourceId,
            ipAddress:
              (ip ?? (headers["x-forwarded-for"] as string) ?? null)
                ?.split(",")[0]
                .trim() ?? null,
            userAgent: headers["user-agent"] ?? null,
            statusCode: err?.status ?? 500,
            meta: { error: true },
          });
        },
      }),
    );
  }
}
