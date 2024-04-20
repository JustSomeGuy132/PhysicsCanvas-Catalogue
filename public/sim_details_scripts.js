const simId = window.location.href.slice(-6);

function GetSimDetails(simData){
    const {author, title, desc, images} = simData;
    document.getElementById('simtitle').textContent = title;
    document.getElementById('authorTag').innerHTML = 'By <a href="../Profiles/' + author + '">' + author + '</a>';
    document.getElementById('simdesc').textContent = desc;
    const imgRow = document.getElementsByClassName('small-img-row').item(0);
    images.forEach(img => {
        const newEl = document.createElement('li')
        imgRow.appendChild(newEl);
        newEl.className = 'small-img-col';
        const newImg = document.createElement('img');
        newEl.appendChild(newImg);
        newImg.src = "../Sims/" + img;
        newImg.className = "small-img";
        newImg.width = 100;
    });
    
    const BigImg = document.getElementById("Img0");
    const SmallImg = document.getElementsByClassName("small-img");
    BigImg.src = SmallImg[0].src;

    for(let i = 0; i < SmallImg.length; i++){
        SmallImg[i].onclick = () => BigImg.src = SmallImg[i].src;
    }

    document.getElementById('caller').remove();
}

function DownloadSim(){
    fetch('./simDownload',
    {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({simId})
    })
    .then(respose => respose.blob())
    .then(blob => download(blob, document.getElementById('simtitle').textContent + ".psim"));
}

function SaveSim(){
    fetch('./simSave',
    {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({simId})
    })
    .then(response => response.text())
    .then(message => alert(message));
}