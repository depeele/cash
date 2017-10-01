/* jshint laxbreak: true */
function _getDataCache(node) {
  return (node[cash.uid] = node[cash.uid] || {});
}

function _setData(node, key, value) {
  return (_getDataCache(node)[key] = value);
}

function _getData(node, key) {
  const cache = _getDataCache(node);
  if ( cache[key] === undefined ) {
    cache[key] = (node.dataset
                    ? node.dataset[key]
                    : cash(node).attr('data-'+key));
  }
  return cache[key];
}

function _removeData(node, key) {
  const cache = _getDataCache(node);
  if ( cache )             { delete cache[key]; }
  else if ( node.dataset ) { delete node.dataset[key]; }
  else                     { cash(node).removeAttr('data-' + name); }
}

cash.fn.extend({

  data(name, value) {

    if ( cash.isString(name) ) {
      return ( value === undefined
                ?  _getData(this[0],name)
                : this.each(el => _setData(el,name,value) )
      );
    }

    for (let key in name) {
      this.data( key, name[key] );
    }

    return this;
  },

  removeData(key) {
    return this.each(el => _removeData(el,key) );
  },
});

cash.getData = _getData;
cash.setData = _setData;
