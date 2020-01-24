
rel:
	@cd pure \
		&& rm -Rf node_modules || true  \
		&& rm -f package-lock.json || true \
		&& ncu -u \
		&& npm install \
		&& npm version patch \
		&& npm publish \
		&& cd - \
		&& git add pure
	@cd hoc \
		&& rm -Rf node_modules || true \
		&& rm -f package-lock.json || true \
		&& ncu -u \
		&& npm install \
		&& npm version patch \
		&& npm publish \
		&& cd - \
		&& git add hoc
	@git commit -m "update deps"
	@git push
