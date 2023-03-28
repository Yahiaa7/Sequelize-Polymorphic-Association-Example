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
        }
    },
    {
        timestamps: false,
        freezeTableName: true
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


sequelize.sync({ alter: true }).then(async () => {
    console.log('DB Synced!');

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

}).catch((err) => {
    console.log(`Error"\n${err}`);
});
