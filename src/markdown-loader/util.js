const upper = (all, letter = '') => {
    return letter.toUpperCase();
};

module.exports.switchCompName = (componentName = '') => {
    return componentName.replace(/-(\w)/g, upper);
}