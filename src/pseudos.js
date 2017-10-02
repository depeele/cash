/* jshint laxbreak: true, bitwise:false */
cash._pseudos = {
  focus   : (el) => {
    return (el === document.activeElement &&
            (!document.hasFocus || document.hasFocus()) &&
            !!(el.type || el.href || ~(el.tabIndex) ));
  },
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
    // :empty is negated by element (1) or content nodes
    //        (text: 3; cdata: 4; entity ref: 5),
    //        but not by others (comment: 8; processing instruction: 7; etc.)
    //        nodeType < 6 works because attributes (2) do not appear as
    //        children
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
