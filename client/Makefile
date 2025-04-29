FILES = static/index.js static/index.css

HASHED_FILES = $(patsubst %, dist/%, $(FILES))

pack: $(HASHED_FILES)
	@node package.js; \
	 cp index.html dist/index.html; \
	 mv index.hashed.html dist/index.html; \
	 cd dist; \
	 scp index.html root@ubuntu:/var/www/html/

# dist/<name>.<hash>.<ext>
dist/%: %
	@mkdir -p $(dir $@)
	@hash=$$(sha256sum $< | cut -c1-8); \
	 target="$<"; \
	 ext=$${target##*.}; \
	 name=$$(basename "$<" .$$ext ); \
	 dir=$$(dirname $@); \
	 newname=$$dir/$$name.$$hash.$$ext; \
	 cp "$<" "$$newname"; \
	 scp $$newname root@ubuntu:/var/www/html/static/; 


# 清理
clean:
	rm -rf dist
