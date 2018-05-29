const {Builder, By, Key, until} = require('selenium-webdriver');

async function example() {
    let driver = new Builder()
      .forBrowser("chrome")
      .usingServer("http://localhost:4444/wd/hub")
      .build();
      await driver.getSession();
    await driver.get('http://www.google.com/ncr');
    await driver.findElement(By.name('q')).sendKeys('webdriver', Key.RETURN);
    await driver.wait(until.titleIs('webdriver - Google Search'), 1000);
    //driver.findElement(By.css(""))
    url = await driver.getCurrentUrl();
    console.log(url);
    await driver.quit();
  
}

example();
example();
example();
example();
example();
example();
example();
example();
example();
example();
example();
example();