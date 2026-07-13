const mockModel = () => {
  const Model: any = jest.fn()
  Model.findAll = jest.fn()
  Model.findOne = jest.fn()
  Model.create = jest.fn()
  Model.bulkCreate = jest.fn()
  Model.findByPk = jest.fn()
  Model.count = jest.fn()
  Model.findAndCountAll = jest.fn()
  Model.update = jest.fn()
  Model.destroy = jest.fn()
  Model.hasMany = jest.fn()
  Model.belongsTo = jest.fn()
  Model.belongsToMany = jest.fn()
  Model.hasOne = jest.fn()
  return Model
}

export const DatabaseConnection = {
  instance: null as any,
  getInstance: jest.fn().mockReturnValue({
    sequelize: {
      define: jest.fn().mockImplementation(() => mockModel()),
      authenticate: jest.fn().mockResolvedValue(undefined),
      sync: jest.fn().mockResolvedValue(undefined),
      query: jest.fn().mockResolvedValue([]),
    },
  }),
}
