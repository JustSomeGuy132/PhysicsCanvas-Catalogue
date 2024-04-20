function OrganiseSims(sims){
    const {simulations} = sims;
    const container = document.getElementById('publishedSims');
    container.innerHTML = simulations.length > 0? '' : "Oops, they haven't published anything!";
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
        //Change the title of the page
        document.getElementsByTagName('h1').item(0).textContent += author + "!";
    });
}
//Split the url by / characters and take the last one to be the username
//Since the url will be Profiles/{username}
const username = window.location.href.split('/').pop();
document.addEventListener('DOMContentLoaded', (e)=>{
    fetch('../profileSims/' + username, { method: 'GET' })
    .then(response => response.json())
    .then(data => OrganiseSims(data))
    .catch(err => alert(err));
});