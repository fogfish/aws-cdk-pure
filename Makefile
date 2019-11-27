
rel:
	@cd pure \
		&& ncu -u \
		&& npm version patch \
		&& npm publish \
		&& cd - \
		&& git add pure
	@cd hoc \
		&& ncu -u \
		&& npm version patch \
		&& npm publish \
		&& cd - \
		&& git add hoc
	@git commit -m "update deps"
	@git push
