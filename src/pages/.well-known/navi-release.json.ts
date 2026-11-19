import snapshot from '../../data/payload-content.json';

export function GET() {
  const release = 'releaseId' in snapshot ? snapshot.releaseId : null;
  return Response.json({release});
}
