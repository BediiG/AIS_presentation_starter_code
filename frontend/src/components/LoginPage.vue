<template>
  <div class="container mt-5">
    <div class="row justify-content-center">
      <div class="col-md-6">
        <div class="card">
          <div class="card-header text-center">
            <h2 v-if="isSignup">Sign Up</h2>
            <h2 v-else>Login</h2>
          </div>
          <div class="card-body">
            <form @submit.prevent="isSignup ? signup() : login()">
              <div class="mb-3">
                <label for="username" class="form-label">Username:</label>
                <input v-model="username" id="username" type="text" class="form-control" required />
              </div>
              <div class="mb-3">
                <label for="password" class="form-label">Password:</label>
                <input v-model="password" id="password" type="password" class="form-control" required />
              </div>
              <div class="text-center">
                <button type="submit" class="btn btn-primary w-100">
                  {{ isSignup ? "Sign Up" : "Login" }}
                </button>
              </div>
            </form>
            <p v-if="error" class="text-danger text-center mt-3">{{ error }}</p>
          </div>
          <div class="card-footer text-center">
            <p>
              <span v-if="isSignup">Already have an account? </span>
              <span v-else>Don't have an account? </span>
              <button @click="toggleSignup" class="btn btn-link text-decoration-none">
                {{ isSignup ? "Login" : "Sign Up" }}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      username: "",
      password: "",
      isSignup: false,
      error: "",
    };
  },
  methods: {
    login() {
      this.$router.push("/success"); 
    },
    signup() {

    },
    toggleSignup() {
      this.isSignup = !this.isSignup;
      this.error = "";
    },
  },
};
</script>

<style>
.container {
  max-width: 500px;
}
.card {
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}
.btn-link {
  color: #007bff;
}
</style>
