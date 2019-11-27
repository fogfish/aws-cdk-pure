
rel:
	@cd pure \
		&& ncu -u \
		&& npm version patch \
		&& npm publish \
		&& cd -
	@cd hoc \
		&& ncu -u \
		&& npm version patch \
		&& npm publish \
		&& cd -
