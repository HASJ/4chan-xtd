/*
This benchmark was created to see if the h function could be optimized.

It is the js setup to input in https://jsbench.me/. The actual tests are generateCatalogThreadHtml(hPE) for the +=
version, and generateCatalogThreadHtml(hJ) for the array.push and .join('') one.

According to https://stackoverflow.com/questions/2087522/does-javascript-have-a-built-in-stringbuilder-class, because js
strings are immutable, .join('') might be faster. This is outdated. In my benchmarks, .joins was actually slower by
about 30% in edge 120, and about 40% slower in firefox 115 esr
*/

const voidElements = new Set(
	['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr',]
);

const E = (function () {
	const str = {
		'&': '&amp;',
		"'": '&#039;',
		'"': '&quot;',
		'<': '&lt;',
		'>': '&gt;'
	};
	const regex = /[&"'<>]/g;
	const fn = function (x) {
		return str[x];
	};
	const output = function (text) {
		return text.toString().replace(regex, fn);
	};
	output.cat = function (templates) {
		let html = '';
		for (let i = 0; i < templates.length; i++) {
			html += templates[i].innerHTML;
		}
		return html;
	};
	return output;
})();

const isEscaped = Symbol('isEscaped');
const hFragment = Symbol('hFragment');

var hPE = function hPE(tag, attributes, ...children) {
	let innerHTML = tag === hFragment ? '' : `<${tag}`;
	if (attributes) {
		for (const [attribute, value] of Object.entries(attributes)) {
			if (!value && value !== 0)
				continue;
			innerHTML += ` ${attribute}`;
			if (value === true)
				continue;
			innerHTML += `="${E(value.toString())}"`;
		}
	}
	if (tag !== hFragment)
		innerHTML += '>';
	const isVoid = tag !== hFragment && voidElements.has(tag);
	if (isVoid) {
		if (children.length)
			throw new TypeError(`${tag} is a void html element and can't have child elements`);
	}
	else {
		for (const child of children) {
			if (child === null || child === undefined || child === '')
				continue;
			if (child instanceof Object && "innerHTML" in child && child[isEscaped]) {
				innerHTML += child.innerHTML;
				continue;
			}
			innerHTML += E(child.toString());
		}
	}
	if (!isVoid && tag !== hFragment)
		innerHTML += `</${tag}>`;
	return { innerHTML, [isEscaped]: true };
};

var hJ = function hJ(tag, attributes, ...children) {
	const innerHTML = tag === hFragment ? [''] : ['<', tag];
	if (attributes) {
		for (const [attribute, value] of Object.entries(attributes)) {
			if (!value && value !== 0)
				continue;
			innerHTML.push(' ', attribute);
			if (value === true)
				continue;
			innerHTML.push('="', E(value.toString()), '"');
		}
	}
	if (tag !== hFragment)
		innerHTML.push('>');
	const isVoid = tag !== hFragment && voidElements.has(tag);
	if (isVoid) {
		if (children.length)
			throw new TypeError(`${tag} is a void html element and can't have child elements`);
	}
	else {
		for (const child of children) {
			if (child === null || child === undefined || child === '')
				continue;
			if (child instanceof Object && "innerHTML" in child && child[isEscaped]) {
				innerHTML.push(child.innerHTML);
				continue;
			}
			innerHTML.push(child.toString());
		}
	}
	if (!isVoid && tag !== hFragment)
		innerHTML.push('</', tag, '>');
	return { innerHTML: innerHTML.join(''), [isEscaped]: true };
};

var generateCatalogThreadHtml = function generateCatalogThreadHtml(h) {
	const thread = { ID: 76759434, boardID: "g" };
	const src = "https://i.4cdn.org/g/1594686780709s.jpg";
	const imgClass = undefined;
	const data = {
		tn_h: 196,
		tn_w: 250,
	};
	const pageCount = 1;
	const postCount = 4;
	const fileCount = 4;
	const staticPath = "//s.4cdn.org/image/";
	const gifIcon = ".gif";
	return h(hFragment, null,
		h("a", { class: "catalog-link", href: `/${thread.board}/thread/${thread.ID}` }, imgClass ?
			h("img", { src: src, class: `catalog-thumb ${imgClass}` }) :
			h("img", { src: src, class: "catalog-thumb", "data-width": data.tn_w, "data-height": data.tn_h })),
		h("div", { class: "catalog-stats" },
			h("span", { title: "Posts / Files / Page" },
				h("span", { class: `post-count${data.bumplimit ? ' warning' : ''}` }, postCount),
				' / ',
				h("span", { class: `file-count${data.imagelimit ? ' warning' : ''}` }, fileCount),
				' / ',
				h("span", { class: "page-count" }, pageCount)),
			h("span", { class: "catalog-icons" },
				thread.isSticky ? h("img", { src: `${staticPath}sticky${gifIcon}`, class: "stickyIcon", title: "Sticky" }) : '',
				thread.isClosed ? h("img", { src: `${staticPath}closed${gifIcon}`, class: "closedIcon", title: "Closed" }) : '')));
};