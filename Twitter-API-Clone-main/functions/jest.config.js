const jestConfig = {
    verbose: true,
    preset: 'ts-jest',
    transform: {
        '^.+\\.(ts|tsx)?$': 'ts-jest',
        "^.+\\.(js|jsx)$": "babel-jest",
    },
    testMatch: ['**/tests/*.js?(x)'],
}

module.exports = jestConfig