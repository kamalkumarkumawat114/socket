$(document).ready(function() {
    const socket = io();

    function showError(fieldId, message) {
        const errorElement = $('#' + fieldId + 'Error');
        if (!errorElement.length) {
            $('#' + fieldId).after('<div id="' + fieldId + 'Error" class="error-message">' + message + '</div>');
        }
    }

    function removeError(fieldId) {
        $('#' + fieldId + 'Error').remove();
    }

    function validateForm() {
        let isValid = true;
        const namePattern = /^[a-zA-Z]+$/;
    
           
               if (!namePattern.test($('#firstName').val().trim())) {
                    showError('firstName', 'First Name must contain only alphabetic characters');
                    isValid = false;
                } else {
                    removeError('firstName');
                }
    
           
                if (!namePattern.test($('#lastName').val().trim())) {
                showError('lastName', 'Last Name must contain only alphabetic characters');
                isValid = false;
                } else {
                    removeError('lastName');
                }
    
          
                const mobile = $('#mobile').val();
                const mobilePattern = /^\d{10}$/;
                if (!mobilePattern.test(mobile)) {
                    showError('mobile', 'Mobile number must be 10 digits');
                    isValid = false;
                } else {
                    removeError('mobile');
                }
    
                const email = $('#email').val();
                const emailPattern = /^\S+@\S+\.\S+$/;
                if (!emailPattern.test(email)) {
                    showError('email', 'Please enter a valid email');
                    isValid = false;
                } else {
                    removeError('email');
                }
    
               
                if ($('#address').val().trim() === "") {
                    showError('address', 'Address is required');
                    isValid = false;
                } else {
                    removeError('address');
                }
    
              
                if ($('#street').val().trim() === "") {
                    showError('street', 'Street is required');
                    isValid = false;
                } else {
                    removeError('street');
                }
    
                const city = $('#city').val().trim();
            if (!namePattern.test(city) || city.length < 2) {
                showError('city', 'City must contain only alphabetic characters and be at least 2 characters long');
                isValid = false;
            } else {
                removeError('city');
            }
    
          
                const state = $('#state').val().trim();
            if (!namePattern.test(state) || state.length < 2) {
                showError('state', 'State must contain only alphabetic characters and be at least 2 characters long');
                isValid = false;
            } else {
                removeError('state');
            }
    
              
                const country = $('#country').val().trim();
            if (!namePattern.test(country)) {
                showError('country', 'Country must contain only alphabetic characters');
                isValid = false;
            } else {
                removeError('country');
            }
    
             
                const loginId = $('#loginId').val();
                const loginIdPattern = /^[a-zA-Z0-9]{8,}$/;
                if (!loginIdPattern.test(loginId)) {
                    showError('loginId', 'Login ID must be at least 8 characters, alphanumeric');
                    isValid = false;
                } else {
                    removeError('loginId');
                }
    
                const password = $('#password').val();
                const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;
                if (!passwordPattern.test(password)) {
                    showError('password', 'Password must be at least 6 characters, contain 1 uppercase, 1 lowercase, 1 number, 1 special character');
                    isValid = false;
                } else {
                    removeError('password');
                }

        // Validate fields here (same as previous validation code)

        return isValid;
    }
  
    // Registration form submission
    $('#registrationForm').submit(async function(e) {
        e.preventDefault();
        if (!validateForm()) return;
      const formData = {};
      $(this).serializeArray().forEach(field => formData[field.name] = field.value);
      
      try {
        const response = await fetch('/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const result = await response.json();
        if (response.ok) {
          $('#registrationError').text('');
          socket.emit('register', { email: formData.email });
            alert("Registration successful!");
        } else {
          $('#registrationError').text(result.error);
        }
      } catch (error) {
        $('#registrationError').text('Error: Unable to register.');
      }
    });
  
    // Login form submission
    $('#loginForm').submit(async function(e) {
        e.preventDefault();
      const formData = {};
      $(this).serializeArray().forEach(field => formData[field.name] = field.value);
  
      try {
        const response = await fetch('/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const result = await response.json();
        if (response.ok) {
          $('#loginError').text('');
          socket.emit('register', { email: formData.email });
            alert("Login successful!");
        } else {
          $('#loginError').text(result.error);
        }
      } catch (error) {
        $('#loginError').text('Error: Unable to login.');
      }
    });
  
    // Fetch and display live users
    function fetchLiveUsers() {
      fetch('/live-users')
        .then(response => response.json())
        .then(users => {
          const liveUsersTable = $('#liveUsersTable tbody');
          liveUsersTable.empty();
          users.forEach(user => {
            liveUsersTable.append(`
              <tr>
                <td><a href="#" class="userLink" data-user-id="${user._id}">${user.email}</a></td>
                <td>${user.socketId}
                <td>${user.status}</td>
              </tr>
            `);
          });
        });
    }
  
    // Handle click on user email to show details in modal
    $(document).on('click', '.userLink', async function(e) {
      e.preventDefault();
      const userId = $(this).data('user-id');
  
      try {
        const response = await fetch(`/profile/${userId}`);
        const user = await response.json();
        if (response.ok) {
          $('#userDetails').html(`
            <p><strong>Name:</strong> ${user.firstName} ${user.lastName}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Mobile:</strong> ${user.mobile}</p>
            <p><strong>Address:</strong> ${user.address}</p>
            <p><strong>City:</strong> ${user.city}</p>
            <p><strong>State:</strong> ${user.state}</p>
            <p><strong>Country:</strong> ${user.country}</p>
          `);
          $('#userModal').show();
        }
      } catch (error) {
        console.log('Error fetching user details');
      }
    });
  
    // Close modal
    $('.close').click(function() {
      $('#userModal').hide();
    });
  
    // Update live users when a status changes
    socket.on('userStatus', () => {
      fetchLiveUsers();
    });
  
    // Initial fetch of live users
    fetchLiveUsers();
  });
  
