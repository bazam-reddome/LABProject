import { getCurrentUser } from '@/lib/auth';
import { ok, handleError } from '@/lib/api';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return ok({ user: null });
    return ok({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    return handleError(err);
  }
}
