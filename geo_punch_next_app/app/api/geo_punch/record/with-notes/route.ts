import { submitAttendance } from "../_submitAttendance";

export async function POST(req: Request) {
  return submitAttendance(req, { requireNotes: true });
}
