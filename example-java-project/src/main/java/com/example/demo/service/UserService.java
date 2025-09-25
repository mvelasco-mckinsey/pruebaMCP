package com.example.demo.service;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Service class for managing user operations.
 * Provides business logic for user management including CRUD operations.
 */
@Service
public class UserService {
    
    private final UserRepository userRepository;
    
    @Autowired
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    
    /**
     * Retrieves all users from the repository.
     * 
     * @return List of all users
     */
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    
    /**
     * Finds a user by their unique identifier.
     * 
     * @param id the user ID
     * @return Optional containing the user if found
     */
    public Optional<User> getUserById(Long id) {
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("Invalid user ID");
        }
        return userRepository.findById(id);
    }
    
    /**
     * Creates a new user in the system.
     * 
     * @param user the user to create
     * @return the created user with assigned ID
     */
    public User createUser(User user) {
        if (user == null) {
            throw new IllegalArgumentException("User cannot be null");
        }
        if (user.getEmail() == null || user.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("User email is required");
        }
        
        // Check if user already exists
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new IllegalStateException("User with email already exists");
        }
        
        return userRepository.save(user);
    }
    
    /**
     * Updates an existing user.
     * 
     * @param id the user ID
     * @param user the updated user data
     * @return the updated user
     */
    public User updateUser(Long id, User user) {
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("Invalid user ID");
        }
        if (user == null) {
            throw new IllegalArgumentException("User cannot be null");
        }
        
        User existingUser = userRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        existingUser.setName(user.getName());
        existingUser.setEmail(user.getEmail());
        
        return userRepository.save(existingUser);
    }
    
    /**
     * Deletes a user by their ID.
     * 
     * @param id the user ID to delete
     */
    public void deleteUser(Long id) {
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("Invalid user ID");
        }
        
        if (!userRepository.existsById(id)) {
            throw new IllegalArgumentException("User not found");
        }
        
        userRepository.deleteById(id);
    }
    
    /**
     * Searches users by name pattern.
     * 
     * @param namePattern the name pattern to search for
     * @return list of users matching the pattern
     */
    public List<User> searchUsersByName(String namePattern) {
        if (namePattern == null || namePattern.trim().isEmpty()) {
            return getAllUsers();
        }
        
        return userRepository.findByNameContainingIgnoreCase(namePattern);
    }
    
    /**
     * Validates user data before saving.
     * 
     * @param user the user to validate
     * @return true if valid, false otherwise
     */
    private boolean validateUser(User user) {
        return user != null && 
               user.getName() != null && !user.getName().trim().isEmpty() &&
               user.getEmail() != null && user.getEmail().contains("@");
    }
}
