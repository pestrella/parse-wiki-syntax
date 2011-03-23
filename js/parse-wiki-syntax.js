/* jQuery plugin: parseWikiSyntax
 *
 * This plugin will replace any known wiki-style syntax with proper
 * HTML (markup) within a specified class selector, e.g.
 *     $('div.wiki-syntax').parseWikiSyntax();
 *
 * Additionally, text formatting is achieve by defining the following
 * CSS classes appropriately:
 *    em.bold, em.italic, pre.code-block, span.code-rwd,
 *    span.comment-type, span.code-comment
 *
 * @dependencies
 *    - jQuery 1.5.1
 *    - sprintf (http://plugins.jquery.com/project/printf)
 *
 * @license http://www.gnu.org/licenses/gpl.html
 * @author paolo <https://github.com/pestrella>
 */

(function ($) {
  $.fn.parseWikiSyntax = (function (options) {
    var REGEX_CODE_MARKUP = /(\{code\})/g
    var REGEX_CODE_BLOCK = /(\{code\})[^\1]+?\1/g;
    var CODE_MARKER = '###CODE###';
    var REGEX_CODE_MARKER = /###CODE###/;


    var CODE_RESERVED_WORDS = [
      /(abstract)/g, /(final)/g, /(native)/g, /(private)/g,
      /(protected)/g, /(public)/g, /(static)/g, /(transient)/g,
      /(synchronized)/g, /(volatile)/g, /(strictfp)/g, /(private)/g,
      /(protected)/g, /(public)/g, /(try)/g, /(catch)/g, /(finally)/g,
      /(throw)/g, /(break)/g, /(case)()/g, /(continue)/g,
      /(default)/g, /(do)/g, /(while)/g, /(for)/g, /(switch)/g,
      /(if)/g, /(else)/g, /(class[^=])/g, /(extends)/g, /(implements)/g,
      /(import)/g, /(instanceof)/g, /(new)/g, /(package)/g,
      /(return)/g, /(interface)/g, /(this)/g, /(throws)/g, /(void)/g,
      /(super)/g, /(and)/g, /(del)/g, /(from)/g, /(not)/g,
      /(as )/g, /(elif)/g, /(global)/g, /(\Wor\W)/g, /(with)/g,
      /(assert)/g, /(pass)/g, /(yield)/g, /(except)/g, /(exec)/g,
      /(in )/g, /(raise)/g, /(is)/g, /(def)/g, /(lambda)/g
    ];

    var CODE_TYPES = [
      /(\W)(boolean)(\W)/g, /(\W)(byte)(\W)/g, /(\W)(char)(\W)/g, /(\W)(int)(\W)/g, /(\W)(long)(\W)/g,
      /(\W)(short)(\W)/g, /(\W)(float)(\W)/g, /(\W)(double)(\W)/g, /(\W)(true)(\W)/g, /(\W)(false)(\W)/g,
      /(\W)(null)(\W)/g, /(\W)(String)(\W)/g, /(\W)(None)(\W)/g
    ];

    var CODE_COMMENTS = [
      /(\/\/.*)/g, /(\/\*(.|\n)*\*\/)/g, /(#.*)/g
    ]

    var styles = {
      bold: '<em class="bold">%s</em>',
      italic: '<em class="italic">%s</em>',
      bold_italic: '<em class="bold italic">%s</em>',
      code_block: '<pre class="code-block">%s</pre>',
      code_rwd: '<span class="code-rwd">$1</span>',
      code_type: '$1<span class="code-type">$2</span>$3',
      code_comment: '<span class="code-comment">$1</span>'
    };

    /* Take care of *bold*, _italic_, and *_combination_* markup */
    var doFonts = function (node) {
      node.html(node.html()
        .replace(/(\*_)([^_\*]+)\1/g, $.sprintf(styles.bold_italic, '$2'))
        .replace(/(_)([^_]+)\1/g, $.sprintf(styles.italic, '$2'))
        .replace(/(\*)([^*]+)\1/g, $.sprintf(styles.bold, '$2'))
      );
    };

    /* Take care of line breaks. Consecutive newline characters are treated
     * the same as single newline characters: signifies a new paragraph.
     */
    var doParagraphs = function (node) {
      node.html($.trim(node.html())
        .replace(/([^\n]+)(\n+|$)/g, '<p>$1</p>')
      );
    };

    var doLinks = function (node) {
      node.html(node.html()
        .replace(/\[((?:[^\|\[\]]|(?:\\\||\\\[|\\\]))+)\|([^\|\[\]]+)\]/g, '<a href="$2">$1</a>')
        .replace(/\\/g, '') // then clean up: remove the escape characters
      );
    };

    var insertCodeBlocks = function (node, arrayOfCodeBlocks) {
      var index = 0;
      while (REGEX_CODE_MARKER.test(node.html())) {
        var formattedCodeBlock = $.sprintf(
          styles.code_block,
          arrayOfCodeBlocks[index++].replace(REGEX_CODE_MARKUP, '')
        );
        node.html(node.html()
          .replace(REGEX_CODE_MARKER, addSyntaxHighlighting(formattedCodeBlock))
        );
      }
      /* FIXME: Argh! how infuriating, why do I get empty <p> blocks?! Just clean up for now */
      node.html(node.html()
        .replace(/<p><\/p>/g, '')
      );
    };

    var addSyntaxHighlighting = function (code) {
      for (var i = 0; i < CODE_RESERVED_WORDS.length; i++) {
        code = code.replace(CODE_RESERVED_WORDS[i], styles.code_rwd);
      }
      for (var i = 0; i < CODE_TYPES.length; i++) {
        code = code.replace(CODE_TYPES[i], styles.code_type);
      }
      var comments = code.match(CODE_COMMENTS[i]);
      for (var i = 0; i < CODE_COMMENTS.length; i++) {
        /* TODO: replace any previous formatting because this whole match
         * should be a comment and nothing else.
         */
        code = code.replace(CODE_COMMENTS[i], styles.code_comment);
      }
      return code;
    };

    var replaceCodeBlocksWithMarkers = function (node) {
      while (REGEX_CODE_BLOCK.test(node.html())) {
        node.html(node.html()
          .replace(REGEX_CODE_BLOCK, CODE_MARKER)
        );
      }
    };

    return this.each(function () {
      /* get an array of all code blocks */
      var arrayOfCodeBlocks = $(this).html().match(REGEX_CODE_BLOCK);
      replaceCodeBlocksWithMarkers($(this));

      /* do regular syntax parsing */
      doFonts($(this));
      doParagraphs($(this));
      doLinks($(this));

      /* insert code blocks back in */
      insertCodeBlocks($(this), arrayOfCodeBlocks);
    });
  });
})(jQuery);
