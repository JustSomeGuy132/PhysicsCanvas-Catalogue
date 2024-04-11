function OrganiseSims(sims){
    const {simulations} = sims;
    const container = document.getElementById('simContainer');
    container.innerHTML = '';
    let count = 0;
    let row;
    simulations.forEach(content => {
        if(count % 4 === 0){
            row = document.createElement('div');
            row.className = "row";
            container.appendChild(row);
        } count += 1;
        const {id, author, title, description, thumbnail} = content;
        //Clickable image to link to sim details page
        const imgLink = document.createElement('a');
        imgLink.href = "./Simulations/" + id;
        //Container for content
        const newEl = document.createElement('div');
        newEl.className = "col-4";
        imgLink.appendChild(newEl)
        row.appendChild(imgLink);
        //Thumbnail display
        const img = document.createElement('img');
        img.src = thumbnail;
        img.width = 197;
        img.height = 180;
        newEl.appendChild(img);
        //Title text
        const titleEl = document.createElement('h4');
        titleEl.textContent = title;
        newEl.appendChild(titleEl);
        //Author text
        const authorEl = document.createElement('p');
        authorEl.textContent = "By " + author;
        authorEl.style.color = "grey";
        newEl.appendChild(authorEl);
        //Description text
        const descEl = document.createElement('p');
        descEl.textContent = description;
        newEl.appendChild(descEl);
    });
}

document.addEventListener('DOMContentLoaded', (e)=>{
    fetch('../savedSims', { method: 'GET' })
    .then(response => response.json())
    .then(data => OrganiseSims(data))
    .catch(err => alert(err));
});