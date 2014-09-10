NS('org.korsakow');

org.korsakow.Support = new (Class.register('org.korsakow.Support', org.korsakow.Object, {
    isIOS: function() {
        return /(iPad|iPhone|iPod)/g.test(navigator.userAgent);
    }
}));
