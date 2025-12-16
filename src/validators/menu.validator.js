import Joi from 'joi'

const groupSchema = Joi.object({
  nom: Joi.string().max(100).required(),
  code: Joi.string().max(50).required(),
  ordre: Joi.number().integer().default(0),
  visible: Joi.boolean().default(true),
  icon: Joi.string().max(50).optional()
})

const itemSchema = Joi.object({
  libelle: Joi.string().max(100).required(),
  chemin: Joi.string().max(200).optional(),
  icon: Joi.string().max(50).optional(),
  ordre: Joi.number().integer().default(0),
  visible: Joi.boolean().default(true),
  roleMinimum: Joi.string().valid('User', 'Tresorier', 'Admin', 'Superadmin').default('User'),
  groupeId: Joi.string().uuid().optional(),
  parentId: Joi.string().uuid().optional(),
  badge: Joi.number().integer().min(0).default(0)
})

export const validateMenuData = {
  group: (data, isUpdate = false) => {
    const schema = isUpdate ? groupSchema.fork(Object.keys(groupSchema.describe().keys), field => field.optional()) : groupSchema
    return schema.validate(data, { abortEarly: false })
  },
  
  item: (data, isUpdate = false) => {
    const schema = isUpdate ? itemSchema.fork(Object.keys(itemSchema.describe().keys), field => field.optional()) : itemSchema
    return schema.validate(data, { abortEarly: false })
  }
}