const dbConfig = require('./config/db_config.js');
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(
    dbConfig.DB,
    dbConfig.USER,
    dbConfig.PASSWORD,
    {
        host: dbConfig.HOST,
        dialect: dbConfig.dialect,
        operatorAliases: false,
        logging: false
    }
);

const Employee = sequelize.define('employee',
    {
        name: DataTypes.STRING,
    },
    {
        timestamps: false
    }
);


const Transaction = sequelize.define('transaction',
    {
        someText: {
            type: DataTypes.STRING
        },
        transactionID: {
            type: DataTypes.INTEGER
        },
        transaction_type: {
            type: DataTypes.STRING
        },
        transaction_details: {
            type: DataTypes.STRING,
            get() {
                const value = this.getDataValue('transaction_details');
                return value ? value.toJSON() : null;
            }
        },
    },
    {
        timestamps: false,
        freezeTableName: true,
        // defaultScope: {
        //     attributes: {
        //         exclude: ['transaction_type', 'transactionID']
        //     }
        // },
        // scopes: {
        //     fullDetails: {
        //         include: ['transaction_type', 'transactionID']
        //     }
        // }
    }
);

const TransactionTypeA = sequelize.define('typea',
    {
        someText: {
            type: DataTypes.STRING
        }
    },
    {
        timestamps: false,
        freezeTableName: true
    }
);

const TransactionTypeB = sequelize.define('typeb',
    {
        someText: {
            type: DataTypes.STRING
        }
    },
    {
        timestamps: false,
        freezeTableName: true
    }
);

Employee.hasMany(Transaction);

Transaction.belongsTo(Employee);

Transaction.belongsTo(TransactionTypeA, {
    foreignKey: 'transactionID',
    constraints: false
});

TransactionTypeA.hasMany(Transaction, {
    foreignKey: 'transactionID',
    constraints: false,
    scope: {
        transaction_type: 'typea'
    }
});

Transaction.belongsTo(TransactionTypeB, {
    foreignKey: 'transactionID',
    constraints: false
});

TransactionTypeB.hasMany(Transaction, {
    foreignKey: 'transactionID',
    constraints: false,
    scope: {
        transaction_type: 'typeb'
    }
});


Transaction.addHook("afterFind", findResult => {
    if (!Array.isArray(findResult)) findResult = [findResult];
    for (const instance of findResult) {
        console.log(instance.transaction_type);
        if (instance.transaction_type === "typea" && instance.typea !== undefined) {
            instance.transaction_details = instance.typea;
        } else if (instance.transaction_type === "typeb" && instance.typeb !== undefined) {
            instance.transaction_details = instance.typeb;
        }
        // To prevent mistakes:
        delete instance.typea;
        delete instance.dataValues.typea;
        delete instance.typeb;
        delete instance.dataValues.typeb;
    }
});


sequelize.sync({ alter: true }).then(async () => {
    console.log('DB Synced!');
    // uncomment the '/**/' to add fields to database
    /*
    // Method 1
    // we create a transaction of type 'a', TransactionTypeA
    const transactionTA = await TransactionTypeA.create({ someText: 'transaction type a' });
    // then we 'create' a transaction, Transaction, through the TransactionTypeA instance, transactionTA.createTransaction
    const transaction = await transactionTA.createTransaction({ someText: 'transaction 1' });
    // here we cerate an employee, Employee
    const emp = await Employee.create({ name: 'emp1' });
    // then we 'add' the transaction to the employee through Employee instance, emp.addTransaction
    await emp.addTransaction(transaction);

    //////////////////////////////////////////////////////////////
    // Method 2
    // we cerate an employee, Employee
    const emp2 = await Employee.create({ name: 'emp2' });
    // then we 'create' a transaction, Transaction, through Employee instance, emp2.createTransaction
    const transaction2 = await emp2.createTransaction({ someText: 'transaction 2' });

    // here we create a transaction of type 'a', TransactionTypeA
    const transactionTA2 = await TransactionTypeA.create({ someText: 'transaction2 type a' });
     // then we 'add' the transaction to the TransactionTypeA instance, transactionTA2.addTransaction
    await transactionTA2.addTransaction(transaction2);

    
    //////////////////////////////////////////////////////////////
    // Method 1 and 2 have the same result, but different implementation
    //////////////////////////////////////////////////////////////
    const emp3 = await Employee.create({ name: 'emp3' });
    const transaction3 = await emp3.createTransaction({ someText: 'transaction 3' });

    const transactionTB3 = await TransactionTypeB.create({ someText: 'transaction type b' });
    await transactionTB3.addTransaction(transaction3);
    */

    // retrieve all transactions
    const transactions = await Transaction.findAll(
        {
            // where: { employeeId: 1 },
            include: [Employee, TransactionTypeA, TransactionTypeB]
        }
    );

    // for (const t of transactions) {
    //     const message = `Found transaction #${t.id} with ${t.transaction_type} Transaction:`;
    //     console.log(message, t.transaction_details);
    // }

    transactions.forEach(t => {
        console.log(t.toJSON());
    });

}).catch((err) => {
    console.log(`Error"\n${err}`);
});
