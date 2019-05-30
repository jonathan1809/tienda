const Product = require('../models/product');
const sequelize = require('sequelize');
const Op = sequelize.Op
exports.getProducts = async (req, res, next) => {
  const min = req.query.min;
  const max = req.query.max;
  const search = req.query.search;
  const type = req.query;

  // console.log(min, max, type)
  const types = await Product.findAll({
    group: ['Type'],
    attributes: ['Type', [sequelize.fn('COUNT', 'Type'), 'Count']],
  })
  // types.forEach(type => {
  //   console.log(type.dataValues)
  // });
  if(search){
    const criteria = {
      title: {
        [Op.substring]: search
      }
    };
    Product.findAll({ where: criteria })
    .then(products => {

      const session= req.session;
      res.render('shop/product-list', {
        session:session,
        prods: products,
        pageTitle: 'All Products',
        path: '/products',
        types: types
      });
    })
    .catch(err => {
      console.log(err);
    });
  }
  else if (min && max && Object.entries(type).length > 2) {
    const typesFilter = []
    for (const key in type) {
      if (type.hasOwnProperty(key)) {
        const element = type[key];
        typesFilter.push({ type: key })
      }
    }
    var conditionalData = {
      [Op.or]: typesFilter,
      price: {
       
        [Op.between]: [min, max]
      }
    };
 
    Product.findAll({ where: conditionalData })
      .then(products => {

        const session= req.session;
        res.render('shop/product-list', {
          session:session,
          prods: products,
          pageTitle: 'All Products',
          path: '/products',
          types: types
        });
      })
      .catch(err => {
        console.log(err);
      });
  }
  else if (Object.entries(type).length > 0) {
    const typesFilter = []
    for (const key in type) {
      if (type.hasOwnProperty(key)) {
        const element = type[key];
        typesFilter.push({ type: key })
      }
    }
    var conditionalData = {
     
        [Op.or]: typesFilter
      
    };

    Product.findAll({ where: conditionalData })
      .then(products => {

        const session= req.session;
        res.render('shop/product-list', {
          session:session,
          prods: products,
          pageTitle: 'All Products',
          path: '/products',
          types: types
        });
      })
      .catch(err => {
        console.log(err);
      });
  }
  else {
    Product.findAll()
      .then(products => {
        const session= req.session;
        res.render('shop/product-list', {
          session:session,
          prods: products,
          pageTitle: 'All Products',
          path: '/products',
          types: types
        });
      })
      .catch(err => {
        console.log(err);
      });
  }

};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  // Product.findAll({ where: { id: prodId } })
  //   .then(products => {
  //     res.render('shop/product-detail', {
  //       product: products[0],
  //       pageTitle: products[0].title,
  //       path: '/products'
  //     });
  //   })
  //   .catch(err => console.log(err));
  Product.findByPk(prodId)
    .then(product => {
      const session= req.session;
      res.render('shop/product-detail', {
        session:session,
        product: product,
        pageTitle: product.title,
        path: '/products'
      });
    })
    .catch(err => console.log(err));
};

exports.getIndex = (req, res, next) => {
  Product.findAll()
    .then(products => {
      const session= req.session;
      res.render('shop/index', {
        session:session,
        prods: products,
        pageTitle: 'Shop',
        path: '/'
      });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.getCart = (req, res, next) => {
  req.user
    .getCart()
    .then(cart => {
      return cart
        .getProducts()
        .then(products => {
          const session= req.session;
          res.render('shop/cart', {
            session:session,
            path: '/cart',
            pageTitle: 'Your Cart',
            products: products
          });
        })
        .catch(err => console.log(err));
    })
    .catch(err => console.log(err));
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  let fetchedCart;
  let newQuantity = 1;
  req.user
    .getCart()
    .then(cart => {
      fetchedCart = cart;
      return cart.getProducts({ where: { id: prodId } });
    })
    .then(products => {
      let product;
      if (products.length > 0) {
        product = products[0];
      }

      if (product) {
        const oldQuantity = product.cartItem.quantity;
        newQuantity = oldQuantity + 1;
        return product;
      }
      return Product.findByPk(prodId);
    })
    .then(product => {
      return fetchedCart.addProduct(product, {
        through: { quantity: newQuantity }
      });
    })
    .then(() => {
      res.redirect('/cart');
    })
    .catch(err => console.log(err));
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .getCart()
    .then(cart => {
      return cart.getProducts({ where: { id: prodId } });
    })
    .then(products => {
      const product = products[0];
      return product.cartItem.destroy();
    })
    .then(result => {
      res.redirect('/cart');
    })
    .catch(err => console.log(err));
};

exports.postOrder = (req, res, next) => {
  let fetchedCart;
  req.user
    .getCart()
    .then(cart => {
      fetchedCart = cart;
      return cart.getProducts();
    })
    .then(products => {
      return req.user
        .createOrder()
        .then(order => {
          return order.addProducts(
            products.map(product => {
              product.orderItem = { quantity: product.cartItem.quantity };
              return product;
            })
          );
        })
        .catch(err => console.log(err));
    })
    .then(result => {
      return fetchedCart.setProducts(null);
    })
    .then(result => {
      res.redirect('/orders');
    })
    .catch(err =>  res.redirect('/orders'));
};

exports.getOrders = (req, res, next) => {
  req.user
    .getOrders({ include: ['products'] })
    .then(orders => {
      const session= req.session;
      res.render('shop/orders', {
        session:session,
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders
      });
    })
    .catch(err => console.log(err));
};
