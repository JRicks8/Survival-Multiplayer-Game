// const requestModal = document.querySelector(".new-request");
// const requestLink = document.querySelector(".add-request");
// const requestForm = document.querySelector(".new-request form");

//open request modal
// requestLink.addEventListener("click", () => {
// 	requestModal.classList.add("open");
// });

//close request modal
// requestModal.addEventListener("click", (e) => {
// 	if (e.target.classList.contains("new-request")) {
// 		requestModal.classList.remove("open");
// 	}
// });

// add new request
// requestForm.addEventListener("submit", (e) => {
// 	e.preventDefault();

// 	const addRequest = firebase.functions().httpsCallable("addRequest");
// 	addRequest({
// 		text: requestForm.request.value,
// 	})
// 	.then(() => {
// 		console.log("then");
// 		requestForm.reset();
// 		requestForm.querySelector(".error").textContent = "";
// 		requestModal.classList.remove("open");
// 	})
// 	.catch(error => {
// 		requestForm.querySelector(".error").textContent = error.message;
// 		console.log(error);
// 	});
// });

// say hello server function call
// const button = document.querySelector(".call");
// button.addEventListener("click", () => {
// 	// get function ref
// 	const sayHello = firebase.functions().httpsCallable("sayHello");
// 	sayHello({ name: "Jared" }).then(result => {
// 		console.log(result.data);
// 	});
// });



// const requestsData = firebase.firestore().collection("requests");

// function getRequestListItemHTML(text, upvotes) {
//   return `
//     <li>
//       <span class="text">${text}</span>
//       <div>
//         <span class="votes">${upvotes}</span>
//         <i class="material-icons upvote">arrow_upward</i>
//       </div>
//     </li>
//   `
// }

// // called when the "requests" collection in the firestore is changed
// requestsData.onSnapshot(snapshot => {
//   let requests = [];
//   snapshot.forEach(doc => {
//     requests.push({...doc.data(), id: doc.id});
//   });

//   let html = ``;
//   console.log(requests);
//   requests.forEach(request => {
//     html += getRequestListItemHTML(request.text, 0);
//   });
//   document.querySelector(".request-list").innerHTML = html;
// });