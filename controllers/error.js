exports.get404 = (req, res, next) => {
  const session = req.session;
  if (!session.user)
    session.user = { name: '' }
  res.status(404).render('404', { pageTitle: 'Page Not Found', path: '/404', session: session });
};
