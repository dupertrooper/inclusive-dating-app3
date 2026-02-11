(async() => {
    try {
        const res = await fetch('http://localhost:5000/api/health');
        const text = await res.text();
        console.log('HTTP', res.status);
        console.log(text);
    } catch (err) {
        console.error('ERROR', err.message);
        process.exit(1);
    }
})();