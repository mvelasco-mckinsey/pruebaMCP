package com.example.demo.repository;

import com.example.demo.model.User;
import java.util.List;
import java.util.Optional;

/**
 * Repository interface for User entity operations.
 * Defines data access methods for user management.
 */
public interface UserRepository {
    
    /**
     * Retrieves all users from the data store.
     * 
     * @return List of all users
     */
    List<User> findAll();
    
    /**
     * Finds a user by their unique identifier.
     * 
     * @param id the user ID
     * @return Optional containing the user if found
     */
    Optional<User> findById(Long id);
    
    /**
     * Saves a user to the data store.
     * Creates a new user or updates an existing one.
     * 
     * @param user the user to save
     * @return the saved user with assigned ID
     */
    User save(User user);
    
    /**
     * Deletes a user by their ID.
     * 
     * @param id the user ID to delete
     */
    void deleteById(Long id);
    
    /**
     * Checks if a user exists with the given ID.
     * 
     * @param id the user ID
     * @return true if user exists, false otherwise
     */
    boolean existsById(Long id);
    
    /**
     * Checks if a user exists with the given email.
     * 
     * @param email the email to check
     * @return true if user exists with this email, false otherwise
     */
    boolean existsByEmail(String email);
    
    /**
     * Finds users whose name contains the given pattern.
     * Search is case-insensitive.
     * 
     * @param namePattern the name pattern to search for
     * @return list of users matching the pattern
     */
    List<User> findByNameContainingIgnoreCase(String namePattern);
    
    /**
     * Finds users by email domain.
     * 
     * @param domain the email domain to search for
     * @return list of users with emails from the specified domain
     */
    List<User> findByEmailDomain(String domain);
    
    /**
     * Counts the total number of users.
     * 
     * @return total user count
     */
    long count();
}
