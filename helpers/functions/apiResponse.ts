import { NextApiResponse } from 'next';

export default class ApiResponse {
  static success<T>(res: NextApiResponse, message = 'Success', data?: T) {
    res.status(200).json({ status: 200, message, data });
  }

  static badRequest(res: NextApiResponse, message = 'Bad Request') {
    res.status(400).json({ status: 400, message });
  }

  static unauthorized(res: NextApiResponse, message = 'Unauthorized') {
    res.status(401).json({ status: 401, message });
  }

  static forbidden(res: NextApiResponse, message = 'Forbidden') {
    res.status(403).json({ status: 403, message });
  }

  static notFound(res: NextApiResponse, message = 'Not Found') {
    res.status(404).json({ status: 404, message });
  }

  static methodNotAllowed(res: NextApiResponse, message = 'Method Not Allowed') {
    res.status(405).json({ status: 405, message });
  }

  static validationError(res: NextApiResponse, message = 'Validation Error') {
    res.status(422).json({ status: 422, message });
  }

  static serverError(
    res: NextApiResponse,
    message: string = 'API error, contact the administrator.'
  ) {
    res.status(500).json({ status: 500, message });
  }
}
