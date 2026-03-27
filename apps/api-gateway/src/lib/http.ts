import type { FastifyReply } from "fastify";

export function badRequest(reply: FastifyReply, message: string) {
  return reply.code(400).send({ error: message, message });
}

export function forbidden(reply: FastifyReply, message = "Forbidden") {
  return reply.code(403).send({ error: message, message });
}

export function notFound(reply: FastifyReply, message = "Resource not found") {
  return reply.code(404).send({ error: message, message });
}

export function unauthorized(reply: FastifyReply, message = "Invalid credentials") {
  return reply.code(401).send({ error: message, message });
}

export function internalError(reply: FastifyReply, message = "Internal server error") {
  return reply.code(500).send({ error: message, message });
}
