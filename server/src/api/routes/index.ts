import express from 'express'
var router = express.Router()

router.use(require('./competition'))
router.use(require('./user'))
router.use(require('./question'))
router.use(require('./login'))
router.use(require('./results'))

module.exports = router
