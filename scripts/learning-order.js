'use strict';
// 分类分页前按学习路线排序，避免日期倒序把入门教程放到最后。
hexo.extend.filter.register('before_generate', function () {
  hexo.extend.generator.register('category', function (locals) {
    const pagination = require('hexo-pagination');
    const modules = locals.data.learning;
    return locals.categories.reduce((result, category) => {
      const module = modules.find(item => item.name === category.name);
      const positions = new Map((module ? module.posts : []).map((slug, i) => [slug, i]));
      const posts = category.posts.toArray().sort((a, b) =>
        (positions.get(a.slug) ?? Number.MAX_SAFE_INTEGER) - (positions.get(b.slug) ?? Number.MAX_SAFE_INTEGER)
        || b.date.valueOf() - a.date.valueOf() || a.slug.localeCompare(b.slug));
      return result.concat(pagination(category.path, posts, {
        perPage: this.config.category_generator.per_page,
        layout: ['category', 'archive', 'index'],
        format: (this.config.pagination_dir || 'page') + '/%d/',
        data: {category: category.name}
      }));
    }, []);
  });
});
