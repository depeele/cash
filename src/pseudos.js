/* jshint laxbreak: true, bitwise:false, maxstatements:23, maxcomplexity:13 */
function _disabledMatcher( elem ) {
  return elem.disabled === true && ('form' in elem || 'label' in elem);
}

let   _done       = 0;
function _disabledAncestor( elem, context, xml ) {
  const key       = 'legend';     // combinator.next
  const doneName  = _done++;
  const dirruns   = 0;

  const  newCache = [ dirruns, doneName ];
  let    oldCache;
  let    uniqueCache;
  let    outerCache;

  // We can't set arbitrary data on XML nodes, so they don't benefit from combinator caching
  if ( xml ) {
    while ( (elem = elem.parentNode) ) {
      if ( elem.nodeType === 1) {
        if ( _disabledMatcher( elem, context, xml ) ) {
          return true;
        }
      }
    }
  } else {
    while ( (elem = elem.parentNode) ) {
      if ( elem.nodeType === 1) {
        outerCache = elem[ cash.uid ] || (elem[ cash.uid ] = {});

        // Support: IE <9 only
        // Defend against cloned attroperties (jQuery gh-1709)
        uniqueCache = outerCache[ elem.uniqueID ] || (outerCache[ elem.uniqueID ] = {});

        if ( key === elem.nodeName.toLowerCase() ) {
          elem = elem.parentNode || elem;
        } else if ( (oldCache = uniqueCache[ key ]) &&
          oldCache[ 0 ] === dirruns && oldCache[ 1 ] === doneName ) {

          // Assign to newCache so results back-propagate to previous elements
          return (newCache[ 2 ] = oldCache[ 2 ]);
        } else {
          // Reuse newcache so results back-propagate to previous elements
          uniqueCache[ key ] = newCache;

          // A match means we're done; a fail means we have to keep checking
          if ( (newCache[ 2 ] = _disabledMatcher( elem, context, xml )) ) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

/**
 * Handle both :enabled/:disabled pseudos
 * @param elem      The target element
 * @param disabled  true for :disabled; false for :enabled {Boolean};
 */
function _checkDisabled( elem, disabled ) {

  // Known :disabled false positives: fieldset[disabled] > legend:nth-of-type(n+2) :can-disable

  // Only certain elements can match :enabled or :disabled
  // https://html.spec.whatwg.org/multipage/scripting.html#selector-enabled
  // https://html.spec.whatwg.org/multipage/scripting.html#selector-disabled
  if ( 'form' in elem ) {

    // Check for inherited disabledness on relevant non-disabled elements:
    // * listed form-associated elements in a disabled fieldset
    //   https://html.spec.whatwg.org/multipage/forms.html#category-listed
    //   https://html.spec.whatwg.org/multipage/forms.html#concept-fe-disabled
    // * option elements in a disabled optgroup
    //   https://html.spec.whatwg.org/multipage/forms.html#concept-option-disabled
    // All such elements have a 'form' property.
    if ( elem.parentNode && elem.disabled === false ) {

      // Option elements defer to a parent optgroup if present
      if ( 'label' in elem ) {
        if ( 'label' in elem.parentNode ) {
          return elem.parentNode.disabled === disabled;
        } else {
          return elem.disabled === disabled;
        }
      }

      // Support: IE 6 - 11
      // Use the isDisabled shortcut property to check for disabled fieldset ancestors
      return elem.isDisabled === disabled ||

        // Where there is no isDisabled, check manually
        /* jshint -W018 */
        elem.isDisabled !== !disabled &&
          _disabledAncestor( elem ) === disabled;
    }

    return elem.disabled === disabled;

  } else if ( 'label' in elem ) {
    // Try to winnow out elements that can't be disabled before trusting the
    // disabled property.
    //
    // Some victims get caught in our net (label, legend, menu, track), but
    // it shouldn't even exist on them, let alone have a boolean value.
    return elem.disabled === disabled;
  }

  // Remaining elements are neither :enabled nor :disabled
  return false;
}

cash._pseudos = {
  focus   : (el) => {
    return (el === document.activeElement &&
            (!document.hasFocus || document.hasFocus()) &&
            !!(el.type || el.href || ~(el.tabIndex) ));
  },
  enabled : (el) => { return _checkDisabled( el, false ); },
  disabled: (el) => { return _checkDisabled( el, true ); },
  checked : (el) => {
    // In CSS3, :checked should return both checked and selected elements
    // http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
    const nodeName  = el.nodeName;
    return (nodeName === 'INPUT'  && !!el.checked) ||
           (nodeName === 'OPTION' && !!el.selected);
  },
  selected: (el) => {
    return (el.selected === true);
  },
  empty   : (el) => {
    // http://www.w3.org/TR/selectors/#empty-pseudo
    // :empty is negated by element (1) or content nodes (text: 3; cdata: 4; entity ref: 5),
    //   but not by others (comment: 8; processing instruction: 7; etc.)
    // nodeType < 6 works because attributes (2) do not appear as children
    for ( el = el.firstChild; el; el = el.nextSibling ) {
      if ( el.nodeType < 6 ) {
        return false;
      }
    }
    return true;
  },
  input   : (el) => {
    return ['INPUT','SELECT','TEXTAREA','BUTTON']
              .includes( el.nodeName );
  },
  button  : (el) => {
    const name = el.nodeName;
    return (name === 'INPUT' && el.type === 'button' ||
            name === 'BUTTON');
  },
};
