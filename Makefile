.PHONY: infra-up infra-down infra-ps infra-logs infra-restart stack-up stack-down stack-ps stack-logs stack-restart stack-rebuild db-migrate db-status

infra-up:
	npm run infra:up

infra-down:
	npm run infra:down

infra-ps:
	npm run infra:ps

infra-logs:
	npm run infra:logs

infra-restart:
	npm run infra:restart

stack-up:
	npm run stack:up

stack-down:
	npm run stack:down

stack-ps:
	npm run stack:ps

stack-logs:
	npm run stack:logs

stack-restart:
	npm run stack:restart

stack-rebuild:
	npm run stack:rebuild

db-migrate:
	npm run db:migrate

db-status:
	npm run db:status
